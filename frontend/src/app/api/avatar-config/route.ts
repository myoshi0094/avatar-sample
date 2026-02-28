import { avatarConfig } from "@/lib/avatarConfig";

export async function GET() {
  return Response.json(avatarConfig);
}
