// src/lib/server/authz.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantId, validateTenantMembership } from "@/lib/tenant-resolver";

type Ok =
  | { ok: true; user: any; tenantId: string; tenantSlug?: string }
  | { ok: false; status: 401 | 403 | 404 | 500; message: string };

export async function requireTenant(ctx: { request: Request }): Promise<Ok> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  );

  // Step 1: Authenticate user
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  console.log('🔍 requireTenant: Auth check', {
    hasUser: !!user,
    userId: user?.id,
    authError: authErr?.message
  });

  if (authErr || !user) {
    console.log('❌ requireTenant: Auth failed', authErr);
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  // Step 2: Get tenant parameter
  const url = new URL(ctx.request.url);
  const tenantParam = url.searchParams.get("tenant") ?? undefined;

  console.log('🔍 requireTenant: Request info', {
    url: url.href,
    tenantParam,
    userId: user.id
  });

  let tenantId: string;

  if (tenantParam) {
    try {
      // Resolve tenant parameter to ID (handles both UUID and slug)
      tenantId = await resolveTenantId(tenantParam, supabase);

      // Validate user membership
      const hasAccess = await validateTenantMembership(user.id, tenantId, supabase);
      if (!hasAccess) {
        console.log('❌ requireTenant: User not member of tenant', {
          userId: user.id,
          tenantParam,
          tenantId
        });
        return { ok: false, status: 403, message: `Access denied to tenant '${tenantParam}'` };
      }

      console.log('✅ requireTenant: Tenant access validated', {
        input: tenantParam,
        resolvedId: tenantId,
        userId: user.id
      });

    } catch (error: any) {
      console.log('❌ requireTenant: Tenant resolution failed', {
        tenantParam,
        error: error.message
      });
      return { ok: false, status: 404, message: error.message };
    }
  } else {
    // No tenant specified, get user's first available tenant
    const { data: memberships, error: mErr } = await supabase
      .from("tenant_memberships")
      .select("tenantId")
      .eq("userId", user.id)
      .limit(1);

    if (mErr || !memberships?.length) {
      console.log('❌ requireTenant: No memberships found', {
        userId: user.id,
        error: mErr?.message
      });
      return { ok: false, status: 403, message: "No tenant memberships" };
    }

    tenantId = memberships[0].tenantId;
    console.log('✅ requireTenant: Using default tenant', {
      userId: user.id,
      tenantId
    });
  }

  console.log('🎉 requireTenant: Success', {
    userId: user.id,
    tenantId,
    inputParam: tenantParam
  });

  return {
    ok: true,
    user,
    tenantId,
    tenantSlug: tenantParam
  };
}