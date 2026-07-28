<?php
namespace Controller\Api\Concierge;

use Request;

/**
 * 상품 카탈로그(목록) 조회 API — MD AI 상품 선별용
 * 돈버는명품샵 플랫폼 연동용 : 20260726
 *
 * 파일 : module/Controller/Api/Concierge/CatalogController.php
 * URL  : https://api.viaelite.co.kr/concierge/catalog?key=인증키
 *        &newDays=14        신상 필터(최근 N일 등록). 0/생략이면 전체
 *        &brand=구찌         브랜드명 부분일치(선택)
 *        &minMargin=30      최소 마진율 %(선택)
 *        &inStock=1         품절 제외(선택)
 *        &tag=국내배송       검색태그(goodsSearchWord) 부분일치(선택) — 예: 국내배송
 *        &sort=sales        정렬 new|sales|margin|priceHigh|priceLow (기본 new)
 *        &limit=50&page=1   페이징 (limit 최대 200)
 * 인증 : 헤더 X-API-KEY 또는 파라미터 key
 *
 * 판매/재고 API 와 동일한 인증키를 사용한다.
 * 내부 운영(MD AI)용이므로 공급가(costPrice)·마진을 포함해 내려준다.
 * 인기순 정렬은 유효주문(취소/환불/반품/교환 제외) 누적 판매수량 기준.
 *
 * @package Controller\Api\Concierge
 */
class CatalogController extends \Controller\Api\Controller
{
    /** 판매/재고 API 와 동일한 인증키 사용 */
    const API_KEY = 'e9005b08ec001af40b1cee68f51a392d5e82bb124f6cc86b';

    /** 한 번에 조회 가능한 최대 상품 수 */
    const MAX_LIMIT = 200;

    public function index()
    {
        $req = Request::get()->all();

        // 0) ping — 새 파일이 실제로 읽히는지 확인용 (DB 없음, 인증 없음)
        //    /concierge/catalog?ping=1  → {"ok":true,...} 나오면 파일 정상 반영됨
        if (isset($req['ping']) === true && $req['ping'] === '1') {
            $this->json(['ok' => true, 'controller' => 'catalog', 'ver' => 'searchTag-2026-07-28', 'ts' => date('Y-m-d H:i:s')]);
        }

        // 1) 인증 — 헤더 우선, 없으면 파라미터
        $server = Request::server()->all();
        $key = isset($server['HTTP_X_API_KEY']) ? $server['HTTP_X_API_KEY'] : '';
        if ($key === '') {
            $key = isset($req['key']) ? $req['key'] : '';
        }
        if ($key !== self::API_KEY) {
            $this->json(['error' => 'unauthorized']);
        }

        // 2) 파라미터 검증
        $newDays = isset($req['newDays']) ? (int) $req['newDays'] : 0;
        if ($newDays < 0 || $newDays > 3650) {
            $newDays = 0;
        }

        $brand = isset($req['brand']) ? trim($req['brand']) : '';
        // 브랜드는 LIKE 부분일치 — 특수문자 최소 제거
        $brand = str_replace(['%', '_', "'", '"'], '', $brand);
        $brand = mb_substr($brand, 0, 50);

        // 검색태그(goodsSearchWord) 부분일치 필터 — 예: tag=국내배송
        $tag = isset($req['tag']) ? trim($req['tag']) : '';
        $tag = str_replace(['%', '_', "'", '"'], '', $tag);
        $tag = mb_substr($tag, 0, 50);

        $minMargin = isset($req['minMargin']) ? (int) $req['minMargin'] : 0;
        if ($minMargin < 0 || $minMargin > 100) {
            $minMargin = 0;
        }

        $inStock = (isset($req['inStock']) === true && $req['inStock'] === '1');

        $sort = isset($req['sort']) ? $req['sort'] : 'new';
        $sortMap = [
            'new' => 'g.regDt DESC',
            'sales' => 'g.orderGoodsCnt DESC, g.regDt DESC',
            'margin' => 'marginAmt DESC, g.regDt DESC',
            'priceHigh' => 'g.goodsPrice DESC',
            'priceLow' => 'g.goodsPrice ASC',
        ];
        if (isset($sortMap[$sort]) === false) {
            $sort = 'new';
        }
        $orderBy = $sortMap[$sort];

        $limit = isset($req['limit']) ? (int) $req['limit'] : 50;
        if ($limit < 1 || $limit > self::MAX_LIMIT) {
            $limit = 50;
        }
        $page = isset($req['page']) ? (int) $req['page'] : 1;
        if ($page < 1) {
            $page = 1;
        }
        $offset = ($page - 1) * $limit;

        $db = \App::load('DB');

        // 2-1) probe 모드 — 실제 컬럼명 확인용 (개발 확정 후 제거)
        //      /concierge/catalog?key=...&probe=1
        if (isset($req['probe']) === true && $req['probe'] === '1') {
            $out = [];
            try {
                $g = $db->query_fetch('SELECT * FROM es_goods LIMIT 1');
                $out['es_goods_columns'] = (empty($g) === false) ? array_keys($g[0]) : [];
            } catch (\Throwable $e) {
                $out['es_goods_error'] = $e->getMessage();
            }
            try {
                $b = $db->query_fetch('SELECT * FROM es_brand LIMIT 1');
                $out['es_brand_columns'] = (empty($b) === false) ? array_keys($b[0]) : [];
            } catch (\Throwable $e) {
                $out['es_brand_error'] = $e->getMessage();
            }
            // goodsNo 지정 시 해당 상품의 비어있지 않은 컬럼 전부 덤프 (검색태그가 어느 컬럼인지 찾기용)
            //   /concierge/catalog?key=...&probe=1&goodsNo=1000549054
            if (isset($req['goodsNo']) === true && $req['goodsNo'] !== '') {
                $gn = preg_replace('/[^0-9]/', '', (string) $req['goodsNo']);
                try {
                    $bind = [];
                    $db->bind_param_push($bind, 's', $gn);
                    $one = $db->query_fetch('SELECT * FROM es_goods WHERE goodsNo = ? LIMIT 1', $bind);
                    if (empty($one) === false) {
                        $nonEmpty = [];
                        foreach ($one[0] as $col => $val) {
                            if ($val !== null && $val !== '') {
                                $nonEmpty[$col] = $val;
                            }
                        }
                        $out['goodsNo'] = $gn;
                        $out['row_nonEmpty'] = $nonEmpty;
                    } else {
                        $out['row_notfound'] = $gn;
                    }
                } catch (\Throwable $e) {
                    $out['row_error'] = $e->getMessage();
                }
            }
            $this->json($out);
        }

        // 3) 조회 — es_goods 단일 테이블
        //  - 진열중(goodsDisplayFl=y) · 판매중(goodsSellFl=y) 상품만
        //  - 브랜드=makerNm(텍스트), 재고=totalStock, 인기=orderGoodsCnt(누적 주문수량)
        $strSQL = '
            SELECT
                g.goodsNo,
                g.goodsNm,
                g.makerNm,
                g.originNm,
                g.brandCd,
                g.goodsPrice,
                g.fixedPrice,
                g.costPrice,
                g.totalStock,
                g.soldOutFl,
                g.orderGoodsCnt,
                g.hitCnt,
                g.wishCnt,
                g.regDt,
                g.goodsSearchWord,
                (g.goodsPrice - g.costPrice) AS marginAmt
            FROM es_goods g
            WHERE g.goodsDisplayFl = ?
              AND g.goodsSellFl = ?
              AND g.delFl = ?
        ';

        $arrBind = [];
        $db->bind_param_push($arrBind, 's', 'y');
        $db->bind_param_push($arrBind, 's', 'y');
        $db->bind_param_push($arrBind, 's', 'n');

        if ($newDays > 0) {
            $strSQL .= ' AND g.regDt >= DATE_SUB(NOW(), INTERVAL ? DAY)';
            $db->bind_param_push($arrBind, 'i', $newDays);
        }

        if ($brand !== '') {
            $strSQL .= ' AND g.makerNm LIKE ?';
            $db->bind_param_push($arrBind, 's', '%' . $brand . '%');
        }

        if ($tag !== '') {
            $strSQL .= ' AND g.goodsSearchWord LIKE ?';
            $db->bind_param_push($arrBind, 's', '%' . $tag . '%');
        }

        if ($inStock === true) {
            $strSQL .= " AND g.soldOutFl = 'n'";
        }

        // 마진율 필터 — 판매가 대비 (판매가-공급가)/판매가
        if ($minMargin > 0) {
            $strSQL .= ' AND g.goodsPrice > 0'
                . ' AND ((g.goodsPrice - g.costPrice) / g.goodsPrice) * 100 >= ?';
            $db->bind_param_push($arrBind, 'i', $minMargin);
        }

        $strSQL .= ' ORDER BY ' . $orderBy . ' LIMIT ? OFFSET ?';
        $db->bind_param_push($arrBind, 'i', $limit);
        $db->bind_param_push($arrBind, 'i', $offset);

        try {
            $rows = $db->query_fetch($strSQL, $arrBind);
        } catch (\Throwable $e) {
            $this->json(['error' => 'query_failed', 'message' => $e->getMessage()]);
        }
        if (empty($rows) === true) {
            $rows = [];
        }

        // 4) 응답 정리
        $nowTs = time();
        $newLine = ($newDays > 0) ? $newDays : 14; // isNew 판정 기준(표시용)
        $list = [];
        foreach ($rows as $r) {
            $sell = (int) $r['goodsPrice'];
            $cost = (int) $r['costPrice'];
            $marginAmt = $sell - $cost;
            $marginRate = ($sell > 0) ? round($marginAmt / $sell * 100, 1) : 0;

            $regDt = $r['regDt'];
            $isNew = false;
            if (empty($regDt) === false && strpos($regDt, '0000-00-00') !== 0) {
                $isNew = (strtotime($regDt) >= $nowTs - $newLine * 86400);
            }

            $list[] = [
                'goodsNo' => (string) $r['goodsNo'],
                'goodsNm' => $r['goodsNm'],
                'brand' => ($r['makerNm'] !== null) ? $r['makerNm'] : '',   // 제조사=브랜드
                'origin' => ($r['originNm'] !== null) ? $r['originNm'] : '', // 원산지
                'searchTag' => ($r['goodsSearchWord'] !== null) ? $r['goodsSearchWord'] : '', // 검색태그(예: 국내배송)
                'brandCd' => ($r['brandCd'] !== null) ? (string) $r['brandCd'] : '',
                'sellPrice' => $sell,                  // 판매가
                'listPrice' => (int) $r['fixedPrice'],  // 정가(시중가)
                'costPrice' => $cost,                   // 공급가(매입원가) — 내부용
                'marginAmt' => $marginAmt,              // 마진액
                'marginRate' => $marginRate,            // 마진율 %
                'salesQty' => (int) $r['orderGoodsCnt'], // 누적 주문수량(인기)
                'views' => (int) $r['hitCnt'],           // 조회수
                'wish' => (int) $r['wishCnt'],           // 찜
                'stock' => (int) $r['totalStock'],       // 총 재고
                'soldOut' => ($r['soldOutFl'] === 'y'),
                'isNew' => $isNew,
                'regDt' => $regDt,
                'viewUrl' => 'https://viaelite.co.kr/goods/goods_view.php?goodsNo=' . $r['goodsNo'],
            ];
        }

        $this->json([
            'newDays' => $newDays,
            'brand' => $brand,
            'tag' => $tag,
            'minMargin' => $minMargin,
            'inStock' => $inStock,
            'sort' => $sort,
            'page' => $page,
            'limit' => $limit,
            'count' => count($list),
            'list' => $list,
        ]);
    }
}
