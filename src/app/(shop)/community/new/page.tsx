import { redirect } from "next/navigation";
import { getSessionPartner } from "@/lib/auth";
import { getActiveCommunityCategories } from "@/lib/community";
import NewPostForm from "./NewPostForm";

export const dynamic = "force-dynamic";

export default async function NewCommunityPost() {
  const partner = await getSessionPartner();
  if (!partner) redirect("/community");
  if (partner.status !== "approved") redirect("/community");
  const categories = await getActiveCommunityCategories();

  return (
    <div className="px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold">글쓰기</h1>
      <NewPostForm categories={categories.map((c) => ({ key: c.key, label: c.label }))} />
    </div>
  );
}
