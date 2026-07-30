"use client";

export default function RetryButton() {
  return (
    <button onClick={() => location.reload()} className="btn-brand mt-6 px-6">
      다시 시도
    </button>
  );
}
