<?php
namespace Controller\Api\Concierge;

use Request;

/**
 * 컨시어지(영업사원) 판매내역 API
 * 돈버는명품샵 플랫폼 연동용 : 20260724
 *
 * 파일 : module/Controller/Api/Concierge/SalesController.php
 * URL  : https://api.viaelite.co.kr/concierge/sales
 *        ?key=인증키&from=2026-07-01&to=2026-07-31[&code=cd001ws][&limit=500][&scope=all]
 * 인증 : 헤더 X-API-KEY 또는 파라미터 key
 *
 * 관리자 [영업사원 통계] 와 동일한 조인/제외조건을 사용하되,
 * 플랫폼 연동에 필요한 컬럼만 선별해서 내보낸다.
 * (고객 개인정보·매입원가 등 민감정보는 응답에 포함하지 않는다.)
 *
 * @package Controller\Api\Concierge
 */
class SalesController extends \Controller\Api\Controller
{
    /** 플랫폼과 공유하는 인증키 — 반드시 긴 랜덤 문자열로 바꿔서 사용 */
    const API_KEY = 'CHANGE_ME_여기에_긴_랜덤_문자열';

    /** 한 번에 가져올 수 있는 최대 건수 */
    const MAX_LIMIT = 5000;

    /**
     * index
     */
    public function index()
    {
        $req = Request::get()->all();

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
        $from = isset($req['from']) ? $req['from'] : date('Y-m-d', strtotime('-30 days'));
        $to = isset($req['to']) ? $req['to'] : date('Y-m-d');
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) !== 1 || preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) !== 1) {
            $this->json(['error' => 'invalid date. use YYYY-MM-DD']);
        }

        $code = isset($req['code']) ? $req['code'] : '';
        if ($code !== '' && preg_match('/^[A-Za-z0-9_-]{1,32}$/', $code) !== 1) {
            $this->json(['error' => 'invalid code']);
        }

        $limit = isset($req['limit']) ? (int) $req['limit'] : 500;
        if ($limit < 1 || $limit > self::MAX_LIMIT) {
            $limit = 500;
        }

        // scope=all 이면 취소/반품/교환/환불까지 포함 (정산 차감 확인용)
        $scope = (isset($req['scope']) === true && $req['scope'] === 'all') ? 'all' : 'valid';

        // 3) 조회 — 필요한 컬럼만 선별 (민감정보 제외)
        $db = \App::load('DB');

        $strSQL = '
            SELECT
                s.orderNo,
                s.salesAgentCode,
                s.regDt,
                og.goodsNo,
                og.goodsNm,
                og.makerNm,
                og.originNm,
                og.optionInfo,
                og.goodsCnt,
                og.goodsPrice,
                og.fixedPrice,
                IFNULL(og.salesDiscountPrice, 0) AS salesDiscountPrice,
                og.orderStatus,
                og.paymentDt,
                og.deliveryCompleteDt,
                og.finishDt,
                og.cancelDt
            FROM mc_sales_agent_statistics s
            INNER JOIN ' . DB_ORDER . ' o ON s.orderNo = o.orderNo AND s.salesAgentCode = o.salesAgentCode
            INNER JOIN ' . DB_ORDER_GOODS . ' og ON s.orderNo = og.orderNo
            WHERE DATE(s.regDt) BETWEEN ? AND ?
        ';

        $arrBind = [];
        $db->bind_param_push($arrBind, 's', $from);
        $db->bind_param_push($arrBind, 's', $to);

        if ($scope === 'valid') {
            // 관리자 통계 화면과 동일한 제외 조건 (주문대기 o / 환불 f / 취소 c / 반품 r / 교환 b)
            $strSQL .= "
                AND og.orderStatus NOT LIKE 'o%'
                AND og.orderStatus NOT LIKE 'f%'
                AND og.orderStatus NOT LIKE 'c%'
                AND og.orderStatus NOT LIKE 'r%'
                AND og.orderStatus NOT LIKE 'b%'
            ";
        }

        if ($code !== '') {
            $strSQL .= ' AND s.salesAgentCode = ?';
            $db->bind_param_push($arrBind, 's', $code);
        }

        $strSQL .= ' ORDER BY s.regDt DESC LIMIT ?';
        $db->bind_param_push($arrBind, 'i', $limit);

        $rows = $db->query_fetch($strSQL, $arrBind);
        if (empty($rows) === true) {
            $rows = [];
        }

        // 4) 응답 정리
        $list = [];
        foreach ($rows as $r) {
            $qty = (int) $r['goodsCnt'];
            $unit = (int) $r['goodsPrice'];

            // 옵션명 추출: optionInfo = [["사이즈","Black-S","sku",0,null]]
            $optionName = '';
            if (empty($r['optionInfo']) === false) {
                $opt = json_decode($r['optionInfo'], true);
                if (is_array($opt) === true && isset($opt[0][1]) === true) {
                    $optionName = $opt[0][1];
                }
            }

            $finish = $this->cleanDate($r['finishDt']);
            $deliveryDone = $this->cleanDate($r['deliveryCompleteDt']);
            $cancel = $this->cleanDate($r['cancelDt']);

            // 정산 상태 — 구매확정(finishDt) 되었으면 confirmed
            if ($cancel !== null) {
                $settle = 'canceled';
            } elseif ($finish !== null) {
                $settle = 'confirmed';
            } else {
                $settle = 'pending';
            }

            $list[] = [
                'orderNo' => $r['orderNo'],
                'code' => $r['salesAgentCode'],
                'orderedAt' => $r['regDt'],
                'paidAt' => $this->cleanDate($r['paymentDt']),
                'deliveredAt' => $deliveryDone,
                'confirmedAt' => $finish,
                'orderStatus' => $r['orderStatus'],
                'settleStatus' => $settle,
                'goodsNo' => $r['goodsNo'],
                'goodsNm' => $r['goodsNm'],
                'brand' => $r['makerNm'],
                'origin' => $r['originNm'],
                'optionName' => $optionName,
                'qty' => $qty,
                'salePrice' => $unit,
                'listPrice' => (int) $r['fixedPrice'],
                'discount' => (int) $r['salesDiscountPrice'],
                'amount' => $unit * $qty,
            ];
        }

        $this->json([
            'from' => $from,
            'to' => $to,
            'code' => $code,
            'scope' => $scope,
            'total' => count($list),
            'list' => $list,
        ]);
    }

    /**
     * '0000-00-00 00:00:00' 은 null 로 정리
     */
    private function cleanDate($v)
    {
        if (empty($v) === true) {
            return null;
        }
        if (strpos($v, '0000-00-00') === 0) {
            return null;
        }
        return $v;
    }
}
