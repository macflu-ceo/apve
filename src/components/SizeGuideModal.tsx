"use client";

import { useState } from "react";

type Table = { rows: { label: string; values: string[] }[] ; note?: string[] };

const TABS: { key: string; label: string; tables: Table[] }[] = [
  {
    key: "men-apparel",
    label: "남성 의류",
    tables: [
      {
        rows: [
          { label: "구분", values: ["S", "M", "L", "XL", "XXL"] },
          { label: "한국(KR)", values: ["90-95", "95-100", "100-105", "105-110", "115-115"] },
          { label: "영국(UK)", values: ["36", "38", "40", "42", "44"] },
          { label: "유럽(EU)", values: ["46", "48", "50", "52", "54"] },
          { label: "넘버", values: ["1", "2", "3", "4", "5"] },
          { label: "바지(허리)", values: ["30", "32", "34", "36", "38"] },
        ],
        note: ["측정 단위 : 한국(KR), 영국(UK), 유럽(EU)", "바지(허리) : 인치(inch) 기준"],
      },
    ],
  },
  {
    key: "men-shoes",
    label: "남성 신발",
    tables: [
      {
        rows: [
          { label: "한국(KR)", values: ["250", "255", "260", "265", "270", "275", "280", "285", "290"] },
          { label: "유럽(EU)", values: ["40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44"] },
          { label: "영국(UK)", values: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"] },
          { label: "미국(US)", values: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"] },
        ],
        note: ["측정 단위 : 한국(KR mm), 유럽(EU), 영국(UK), 미국(US)"],
      },
    ],
  },
  {
    key: "women-apparel",
    label: "여성 의류",
    tables: [
      {
        rows: [
          { label: "구분", values: ["XS(0)", "S(1)", "M(2)", "L(2-3)", "XL(3)"] },
          { label: "한국(KR)", values: ["44-55", "55-66", "66", "77", "88"] },
          { label: "표준", values: ["85", "90", "95", "100", "105"] },
          { label: "영국(UK)", values: ["06", "08", "10", "12", "14"] },
          { label: "이탈리아(IT)", values: ["38", "40", "42", "44", "46"] },
          { label: "프랑스(FR)", values: ["34", "36", "38", "40", "42"] },
          { label: "바지(허리)", values: ["24-25", "26-27", "28-29", "30-31", "32-33"] },
        ],
        note: ["측정 단위 : 한국(KR), 영국(UK), 이탈리아(IT), 프랑스(FR)", "바지(허리) : 인치(inch) 기준"],
      },
    ],
  },
  {
    key: "women-shoes",
    label: "여성 신발",
    tables: [
      {
        rows: [
          { label: "한국(KR)", values: ["220", "225", "230", "235", "240", "245", "250", "255", "260"] },
          { label: "이탈리아(IT)", values: ["35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39"] },
          { label: "프랑스(FR)", values: ["36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5", "40"] },
          { label: "영국(UK)", values: ["2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6"] },
          { label: "미국(US)", values: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"] },
        ],
        note: ["측정 단위 : 한국(KR mm), 이탈리아(IT), 프랑스(FR), 영국(UK), 미국(US)"],
      },
    ],
  },
  {
    key: "kids-apparel",
    label: "아동 의류",
    tables: [
      {
        rows: [
          { label: "나이", values: ["0-3개월", "3-6개월", "6-9개월", "9-12개월", "12-18개월", "2세", "3세"] },
          { label: "유럽", values: ["3M", "6M", "9M", "12M", "18M", "24M", "3(A/Y/T)"] },
          { label: "나이", values: ["4세", "5세", "6세", "7세", "8세", "9세", "10세"] },
          { label: "유럽", values: ["4(A/Y/T)", "5(A/Y/T)", "6(A/Y/T)", "7(A/Y/T)", "8(A/Y/T)", "9(A/Y/T)", "10(A/Y/T)"] },
          { label: "나이", values: ["11세", "12세", "13세", "14세", "15세", "16세", "17세"] },
          { label: "유럽", values: ["11(A/Y/T)", "12(A/Y/T)", "13(A/Y/T)", "14(A/Y/T)", "15(A/Y/T)", "16(A/Y/T)", "17(A/Y/T)"] },
        ],
        note: ["나이 : 0-3개월 ~ 17세", "유럽 사이즈 : 개월(M), A(Adult)/Y(Youth)/T(Toddler) 표기"],
      },
    ],
  },
  {
    key: "kids-shoes",
    label: "아동 신발",
    tables: [
      {
        rows: [
          { label: "한국(KR)", values: ["85", "90", "95", "100", "105", "110", "115", "120", "125", "130", "135", "140", "145", "150", "155"] },
          { label: "미국(US)", values: ["2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"] },
          { label: "유럽(EU)", values: ["18", "18.5", "19", "19.5", "20", "21", "21.5", "22", "22.5", "23", "24", "25", "25.5", "26", "26.5"] },
          { label: "영국(UK)", values: ["2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5"] },
        ],
      },
      {
        rows: [
          { label: "한국(KR)", values: ["160", "165", "170", "175", "180", "185", "190", "195", "200", "205", "210", "215", "220", "225", "230"] },
          { label: "미국(US)", values: ["10", "10.5", "11", "11.5", "12", "12.5", "13", "13.5", "1", "1.5", "2", "2.5", "3", "3.5", "4"] },
          { label: "유럽(EU)", values: ["27", "27.5", "28", "28.5", "29", "30", "31", "31.5", "32", "33", "33.5", "34", "35", "35.5", "36"] },
          { label: "영국(UK)", values: ["9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "13.5", "14", "14.5", "15", "15.5", "16", "16.5"] },
        ],
        note: ["측정 단위 : 한국(KR mm), 미국(US), 유럽(EU), 영국(UK)"],
      },
    ],
  },
];

/** 상품 카테고리로 기본 탭 추정 */
function guessTab(category?: string | null, name?: string | null): string {
  const s = `${category ?? ""} ${name ?? ""}`;
  const isShoes = /신발|슈즈|스니커|부츠|로퍼|샌들|shoe|sneaker|boot/i.test(s);
  const isKids = /아동|키즈|주니어|kids|junior/i.test(s);
  const isWomen = /여성|우먼|women|female|원피스|스커트|블라우스/i.test(s);
  if (isKids) return isShoes ? "kids-shoes" : "kids-apparel";
  if (isWomen) return isShoes ? "women-shoes" : "women-apparel";
  return isShoes ? "men-shoes" : "men-apparel";
}

export default function SizeGuideModal({
  category,
  productName,
}: {
  category?: string | null;
  productName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(() => guessTab(category, productName));
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-brand underline">
        사이즈표 보기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-2xl font-black">SIZE GUIDE</h2>
              <button onClick={() => setOpen(false)} className="text-2xl leading-none text-sub">×</button>
            </div>
            <p className="mb-5 text-xs text-sub">
              국가별 사이즈가 다를 수 있으니 구매 전 사이즈를 꼭 확인해 주세요.
              <br />
              실제 측정 사이즈이며 약간의 오차가 있을 수 있습니다.
            </p>

            {/* 탭 */}
            <div className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-line">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-bold ${
                    t.key === tab ? "bg-ink text-white" : "bg-[#f7f6f4] text-sub"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mb-2 border-l-4 border-ink pl-2 text-lg font-bold">{current.label}</div>

            {current.tables.map((tbl, ti) => (
              <div key={ti} className="mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-center text-sm">
                    <tbody>
                      {tbl.rows.map((r, ri) => (
                        <tr key={ri} className="border-b border-line">
                          <th className="whitespace-nowrap bg-[#f7f6f4] px-3 py-2 text-left font-bold">{r.label}</th>
                          {r.values.map((v, vi) => (
                            <td key={vi} className="px-3 py-2">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tbl.note && (
                  <ul className="mt-3 rounded-lg bg-[#f7f6f4] p-3 text-xs text-ink/70">
                    {tbl.note.map((n, i) => (
                      <li key={i}>• {n}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
