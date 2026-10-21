import { passwordAuth } from "@/lib/password-routes";

export async function POST(request: Request) { return passwordAuth(request, "register"); }
