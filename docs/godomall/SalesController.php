<?php
namespace Controller\Api\Concierge;

use Component\Moacoms\McSalesAgentStatistics;
use Request;

/**
 * 컨시어지(영업사원) 판매내역 API
 * 돈버는명품샵 플랫폼 연동용 : 20260724
 *
 * 파일 : module/Controller/Api/Concierge/SalesController.php
 * URL  : https://api.viaelite.co.kr/concierge/sales
 *        ?from=2026-07-01&to=2026-07-31[&code=cd001ws][&limit=500]
 * 인증 : 헤더 X-API-KEY 또는 파라미터 key
 *
 * 관리자 [영업사원 통계 > 상세 내역] 과 동일한 모듈을 그대로 사용한다.
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

        // 2) 파라미터 검증 — 형식이 어긋나면 조회 자체를 하지 않는다
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

        // 3) 관리자 통계 화면과 동일한 모듈 호출 (상세 내역)
        $statistics = new McSalesAgentStatistics();
        $rows = $statistics->getAllDetailStatistics($from, $to, $code, $limit);
        if (empty($rows) === true) {
            $rows = [];
        }

        // 4) 응답
        $this->json([
            'from' => $from,
            'to' => $to,
            'code' => $code,
            'total' => count($rows),
            'list' => $rows,
        ]);
    }
}
