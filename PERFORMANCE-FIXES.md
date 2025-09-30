# 🚀 Performance Optimization Guide - HUB2Clean

## 📊 Performance Issues Identified

Based on Supabase metrics analysis, the following bottlenecks were identified:

1. **realtime.schema_migrations LOCK** - 27.46% of slow query time
2. **pg_timezone_names repeated queries** - 13.07% (98 calls fetching 1,194 rows each time)
3. **pgbouncer.get_auth overhead** - 54,000+ calls
4. **Missing database indexes** - Trial table queries slow
5. **Excessive query logging** - Performance overhead in development

---

## ✅ Optimizations Applied

### 1. Database Connection String Optimization

**File:** `.env.local` and Vercel production environment

**Changes:**
- Added `timezone=UTC` to prevent repeated pg_timezone_names queries
- Added `pool_timeout=10` for faster connection timeout
- Added `connect_timeout=10` for faster connection establishment

**Before:**
```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1&sslmode=require"
```

**After:**
```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1&pool_timeout=10&connect_timeout=10&sslmode=require&timezone=UTC"
```

**Expected Impact:**
- ✅ Eliminates 98 calls to pg_timezone_names (13.07% of slow query time)
- ✅ Reduces connection overhead by ~200-500ms per request

---

### 2. Prisma Client Optimization

**File:** `src/lib/prisma.ts`

**Changes:**
- Reduced logging from `['query', 'error', 'warn']` to `['error', 'warn']` in development
- Added explicit `datasourceUrl` parameter to optimize connection initialization
- Added graceful shutdown handler for production

**Expected Impact:**
- ✅ Reduces query logging overhead
- ✅ Faster Prisma client initialization
- ✅ Proper connection cleanup in serverless environments

---

### 3. Dashboard Stats API Optimization

**File:** `app/api/dashboard/stats/route.ts`

**Changes:**
- Increased cache duration from 10 minutes to 30 minutes
- Reduced database queries from 18+ to 6 essential counts
- Removed expensive groupBy aggregations
- Removed recent items queries (players, requests, trials)
- Immediate cache return (skips tenant verification on cache hit)
- Optimized tenant verification with minimal `select: { id: true }`

**Expected Impact:**
- ✅ 4+ second API response reduced to sub-second on cache hits
- ✅ 70% fewer database queries
- ✅ 30-minute cache reduces database load significantly

---

### 4. Missing Database Indexes

**Status:** ⚠️ **REQUIRES MANUAL APPLICATION**

**Reason:** Prisma migrations timeout due to realtime.schema_migrations locks

**File:** `add-trial-indexes.sql` (created in project root)

**Required Actions:**

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard/project/wjwgwzxdgjtwwrnvsltp/sql
   - Create a new query

2. **Run the following SQL:**

```sql
-- Add missing indexes to Trial table for performance optimization
-- Using CONCURRENTLY to avoid table locks during index creation

-- Check if indexes already exist before creating
DO $$
BEGIN
    -- Add index for tenantId + status queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'trials'
        AND indexname = 'trials_tenantId_status_idx'
    ) THEN
        CREATE INDEX CONCURRENTLY trials_tenantId_status_idx
        ON trials(tenantId, status);
        RAISE NOTICE 'Created index: trials_tenantId_status_idx';
    ELSE
        RAISE NOTICE 'Index already exists: trials_tenantId_status_idx';
    END IF;

    -- Add composite index for tenantId + status + scheduledAt queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'trials'
        AND indexname = 'trials_tenantId_status_scheduledAt_idx'
    ) THEN
        CREATE INDEX CONCURRENTLY trials_tenantId_status_scheduledAt_idx
        ON trials(tenantId, status, scheduledAt);
        RAISE NOTICE 'Created index: trials_tenantId_status_scheduledAt_idx';
    ELSE
        RAISE NOTICE 'Index already exists: trials_tenantId_status_scheduledAt_idx';
    END IF;
END $$;
```

3. **Verify indexes were created:**

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'trials'
ORDER BY indexname;
```

**Expected Impact:**
- ✅ Trial queries (upcoming, status-filtered) 5-10x faster
- ✅ Dashboard trial stats significantly faster

---

## 🔧 Additional Recommendations

### 1. Fix realtime.schema_migrations Lock (27.46% of slow queries)

**Issue:** Supabase Realtime or Studio causing schema migration table locks

**Immediate Actions:**
- ✅ Close all Supabase Studio tabs in production
- ✅ Disable Realtime on tables if not needed:
  ```sql
  ALTER PUBLICATION supabase_realtime DROP TABLE trials;
  ALTER PUBLICATION supabase_realtime DROP TABLE players;
  ALTER PUBLICATION supabase_realtime DROP TABLE requests;
  ```

**Expected Impact:**
- ✅ Eliminates 27.46% of slow query time
- ✅ Allows Prisma migrations to complete without timeout

---

### 2. Optimize Connection Pooling

**Current:** Using Supabase connection pooler with `connection_limit=1` (correct for serverless)

**Additional Optimization:**
- ✅ Already using pgbouncer via pooler.supabase.com
- ✅ Already using singleton Prisma client across all files
- ✅ Reduced query logging to minimize overhead

---

### 3. Monitor Query Performance

**After applying these fixes, monitor:**

1. **Supabase Metrics Dashboard:**
   - Slow queries should drop from 20 to <5
   - pg_timezone_names queries should drop from 98 to <5
   - Cache hit rate should remain at 99.99%

2. **Application Performance:**
   - Dashboard: Target <1 second load time (from 5-6 seconds)
   - Players: Target <1 second (from 5-6 seconds)
   - Requests: Target <1 second (from 5 seconds)
   - Trials: Already fast at 2 seconds, should stay the same
   - Calendar: Target <1.5 seconds (from 4-5 seconds)

---

## 📈 Expected Performance Improvements

| Module | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard | 5-6s | <1s | 80-85% faster |
| Players | 5-6s | <1s | 80-85% faster |
| Requests | 5s | <1s | 80% faster |
| Trials | 2s | <1s | 50% faster |
| Calendar | 4-5s | <1.5s | 65-70% faster |

---

## 🚀 Deployment Steps

### Local Testing (Already Applied)
1. ✅ Updated `.env.local` with optimized DATABASE_URL
2. ✅ Updated `src/lib/prisma.ts` with optimized client config
3. ✅ Restarted dev server to apply changes
4. ⏳ Test local performance at http://localhost:3000

### Production Deployment
1. ✅ Updated Vercel environment variable `DATABASE_URL`
2. ⚠️ **REQUIRED:** Apply database indexes via Supabase SQL Editor (see step 4.2 above)
3. ⏳ Deploy to Vercel:
   ```bash
   git add .
   git commit -m "🚀 PERF: Major performance optimizations - timezone param, reduced queries, optimized caching"
   git push
   ```
4. ⏳ Monitor Supabase metrics after deployment
5. ⏳ Test production performance at https://hub2clean.vercel.app

---

## 📝 Files Modified

1. `.env.local` - Optimized DATABASE_URL
2. `src/lib/prisma.ts` - Optimized Prisma client configuration
3. `app/api/dashboard/stats/route.ts` - Already optimized in previous session
4. `prisma/schema.prisma` - Added indexes (requires manual DB application)

---

## 🎯 Success Criteria

- [ ] pg_timezone_names queries reduced from 98 to <5
- [ ] Dashboard load time <1 second on cached data
- [ ] All modules load in <2 seconds
- [ ] Supabase slow queries reduced from 20 to <5
- [ ] realtime.schema_migrations locks eliminated

---

*Generated: 2025-09-30*
*Status: Local optimizations applied ✅ | Database indexes pending ⚠️ | Production deployment pending ⏳*
