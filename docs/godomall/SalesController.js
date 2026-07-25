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
 * 관리자 [영업사원 통계 > 상세 내역] 과 동일한 조건으로 조회한다.
 * (McSalesAgentStatistics::getAllDetailStatistics 와 같은 쿼리 + 상품번호 등 추가 컬럼)
 * 기존 모듈을 고치지 않고 별도로 조회하므로 관리자 화면에 영향이 없다.
 *
 * @package Controller\Api\Concierge
 */
class SalesController extends \Controller\Api\Controller
{
    /** 플랫폼과 공유하는 인증키 — 반드시 긴 랜덤 문자열로 바꿔서 사용 */
    const API_KEY = 'TEST_KEY_20260724_ABC';

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

        // scope=all 이면 취소/반품/교환/환불까지 전부 (정산 차감 확인용)
        $scope = (isset($req['scope']) === true && $req['scope'] === 'all') ? 'all' : 'valid';

        // 3) 조회
        $db = \App::load('DB');

        $strSQL = '
            SELECT s.orderNo, s.salesAgentCode, s.regDt, og.*
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

        // 4) 응답
        $this->json([
            'from' => $from,
            'to' => $to,
            'code' => $code,
            'scope' => $scope,
            'total' => count($rows),
            'list' => $rows,
        ]);
    }
}
