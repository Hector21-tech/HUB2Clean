// src/lib/server/authz.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantId, validateTenantMembership } from "@/lib/tenant-resolver";
import { apiCache } from "@/lib/api-cache";

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
      // OPTIMIZATION: Cache tenant resolution (slug → ID)
      const resolveCacheKey = `tenant-resolve-${tenantParam}`;
      let cachedTenantId = apiCache.get(resolveCacheKey);

      if (cachedTenantId) {
        tenantId = cachedTenantId;
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ requireTenant: Tenant ID from cache', { tenantParam, tenantId });
        }
      } else {
        // Resolve tenant parameter to ID (handles both UUID and slug)
        tenantId = await resolveTenantId(tenantParam, supabase);
        apiCache.set(resolveCacheKey, tenantId);
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 requireTenant: Cached tenant ID', { tenantParam, tenantId });
        }
      }

      // OPTIMIZATION: Cache membership validation
      const membershipCacheKey = `tenant-membership-${user.id}-${tenantId}`;
      let cachedMembership = apiCache.get(membershipCacheKey);

      if (cachedMembership !== null) {
        if (!cachedMembership) {
          console.log('❌ requireTenant: Access denied (cached)', {
            userId: user.id,
            tenantParam,
            tenantId
          });
          return { ok: false, status: 403, message: `Access denied to tenant '${tenantParam}'` };
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ requireTenant: Membership from cache', { userId: user.id, tenantId });
        }
      } else {
        // Validate user membership
        const hasAccess = await validateTenantMembership(user.id, tenantId, supabase);
        apiCache.set(membershipCacheKey, hasAccess);

        if (!hasAccess) {
          console.log('❌ requireTenant: User not member of tenant', {
            userId: user.id,
            tenantParam,
            tenantId
          });
          return { ok: false, status: 403, message: `Access denied to tenant '${tenantParam}'` };
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('💾 requireTenant: Cached membership', { userId: user.id, tenantId });
        }
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
    // OPTIMIZATION: Cache default tenant lookup
    const defaultTenantCacheKey = `tenant-default-${user.id}`;
    let cachedDefaultTenant = apiCache.get(defaultTenantCacheKey);

    if (cachedDefaultTenant) {
      tenantId = cachedDefaultTenant;
      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ requireTenant: Default tenant from cache', { userId: user.id, tenantId });
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
      apiCache.set(defaultTenantCacheKey, tenantId);

      if (process.env.NODE_ENV === 'development') {
        console.log('💾 requireTenant: Cached default tenant', { userId: user.id, tenantId });
      }
    }
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