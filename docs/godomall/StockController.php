<?php
namespace Controller\Api\Concierge;

use Request;

/**
 * 상품 옵션/사이즈별 재고 조회 API
 * 돈버는명품샵 플랫폼 연동용 : 20260724
 *
 * 파일 : module/Controller/Api/Concierge/StockController.php
 * URL  : https://api.viaelite.co.kr/concierge/stock?key=인증키&goodsNo=1000464664
 *        여러 상품 한 번에: &goodsNo=1000464664,1000466838  (콤마 구분, 최대 100개)
 *
 * es_goodsOption 에서 해당 상품의 옵션(색상-사이즈)별 재고를 반환한다.
 *
 * @package Controller\Api\Concierge
 */
class StockController extends \Controller\Api\Controller
{
    /** 판매 API 와 동일한 인증키 사용 */
    const API_KEY = 'CHANGE_ME_여기에_긴_랜덤_문자열';

    /** 한 번에 조회 가능한 상품 수 */
    const MAX_GOODS = 100;

    public function index()
    {
        $req = Request::get()->all();

        // 인증 — 헤더 우선, 없으면 파라미터
        $server = Request::server()->all();
        $key = isset($server['HTTP_X_API_KEY']) ? $server['HTTP_X_API_KEY'] : '';
        if ($key === '') {
            $key = isset($req['key']) ? $req['key'] : '';
        }
        if ($key !== self::API_KEY) {
            $this->json(['error' => 'unauthorized']);
        }

        // 상품번호(들) 검증 — 콤마 구분 허용
        $goodsNoRaw = isset($req['goodsNo']) ? $req['goodsNo'] : '';
        $parts = explode(',', $goodsNoRaw);
        $goodsNos = [];
        foreach ($parts as $p) {
            $p = trim($p);
            if (preg_match('/^\d{1,20}$/', $p) === 1) {
                $goodsNos[] = $p;
            }
        }
        $goodsNos = array_slice(array_values(array_unique($goodsNos)), 0, self::MAX_GOODS);
        if (count($goodsNos) === 0) {
            $this->json(['error' => 'invalid goodsNo']);
        }

        $db = \App::load('DB');

        // IN 절 바인딩
        $marks = implode(',', array_fill(0, count($goodsNos), '?'));
        $strSQL = '
            SELECT
                goodsNo, sno, optionNo,
                optionValue1, optionValue2, optionValue3, optionValue4, optionValue5,
                stockCnt, optionSellFl, sellStopFl, optionViewFl, optionPrice
            FROM es_goodsOption
            WHERE goodsNo IN (' . $marks . ')
              AND optionSellFl = ?
            ORDER BY goodsNo, optionNo, sno
        ';

        $arrBind = [];
        foreach ($goodsNos as $g) {
            $db->bind_param_push($arrBind, 'i', (int) $g);
        }
        $db->bind_param_push($arrBind, 's', 'y');

        $rows = $db->query_fetch($strSQL, $arrBind);
        if (empty($rows) === true) {
            $rows = [];
        }

        // 상품별로 묶기
        $byGoods = [];
        foreach ($rows as $r) {
            $no = $r['goodsNo'];
            if (isset($byGoods[$no]) === false) {
                $byGoods[$no] = ['goodsNo' => (string) $no, 'totalStock' => 0, 'options' => []];
            }

            // 옵션값 조합 (BLACK-L 또는 색상/사이즈 분리형 → "-" 로 합침)
            $vals = [];
            for ($i = 1; $i <= 5; $i++) {
                $v = $r['optionValue' . $i];
                if ($v !== null && $v !== '') {
                    $vals[] = $v;
                }
            }
            $label = implode('-', $vals);

            // 색상 / 사이즈 분리
            if (count($vals) >= 2) {
                $size = $vals[count($vals) - 1];
                $color = implode('-', array_slice($vals, 0, count($vals) - 1));
            } else {
                $cut = strrpos($label, '-');
                if ($cut !== false && $cut > 0) {
                    $color = substr($label, 0, $cut);
                    $size = substr($label, $cut + 1);
                } else {
                    $color = null;
                    $size = $label;
                }
            }

            $stock = (int) $r['stockCnt'];
            $stopped = ($r['sellStopFl'] === 'y');
            $soldOut = ($stock <= 0 || $stopped === true);

            $byGoods[$no]['totalStock'] += ($stock > 0 ? $stock : 0);
            $byGoods[$no]['options'][] = [
                'optionSno' => (int) $r['sno'],
                'label' => $label,
                'color' => $color,
                'size' => $size,
                'stock' => $stock,
                'soldOut' => $soldOut,
                'addPrice' => (int) $r['optionPrice'],
            ];
        }

        // 단일 상품 요청이면 객체로, 여러 개면 배열로
        if (count($goodsNos) === 1) {
            $only = $goodsNos[0];
            $out = isset($byGoods[$only])
                ? $byGoods[$only]
                : ['goodsNo' => (string) $only, 'totalStock' => 0, 'options' => []];
            $this->json($out);
        }

        $this->json(['goods' => array_values($byGoods)]);
    }
}
