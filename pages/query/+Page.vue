<template>
  <div class="mx-auto">

    <div class="tabs tabs-lift">
      <a class="tab" :class="{ 'tab-active': activeTab === 'query' }" @click="activeTab = 'query'">订单查询</a>
      <a class="tab" :class="{ 'tab-active': activeTab === 'local' }" @click="activeTab = 'local'">
        本地订单
        <span v-if="localOrders.length" class="indicator-item badge badge-primary badge-sm ml-1">{{ localOrders.length }}</span>
      </a>
    </div>

    <!-- 本地订单 -->
    <div v-if="activeTab === 'local'" class="card bg-base-100 shadow-sm rounded-tl-none">
      <div class="card-body">
        <div class="mb-2 flex items-center justify-between gap-3">
          <span class="text-sm text-base-content/60">本地订单会在打开页面时自动同步最新状态</span>
          <AppButton size="sm" variant="outline" :loading="syncingLocalOrders" @click="handleRefreshLocalOrders">刷新状态</AppButton>
        </div>
        <div v-if="!localOrders.length" class="flex flex-col items-center gap-2 py-8 text-base-content/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-sm">暂无本地订单，在本设备下单后会自动保存在此</p>
        </div>

        <div v-else class="space-y-2 max-h-96 overflow-y-auto pr-1">
          <a
            v-for="o in localOrders" :key="o.orderNo"
            :href="`/order/${o.orderNo}?token=${encodeURIComponent(o.queryToken)}`"
            class="flex items-center justify-between px-4 py-3 rounded-xl border border-base-200 hover:border-primary/30 hover:bg-base-50 transition-all group"
          >
            <div class="min-w-0">
              <div class="font-mono text-sm font-semibold group-hover:text-primary transition-colors truncate">{{ o.orderNo }}</div>
              <div class="text-xs text-base-content/50 mt-0.5">{{ o.productName }}</div>
            </div>
            <div class="flex items-center gap-3 shrink-0 ml-4">
              <StatusTag v-if="o.status" :type="getOrderStatusType(o.status)" variant="pill">
                {{ getOrderStatusLabel(o.status) }}
              </StatusTag>
              <div class="text-right">
                <div class="text-sm font-bold text-primary">{{ formatCents(o.amount) }}</div>
                <div class="text-xs text-base-content/40">{{ formatDate(o.createdAt) }}</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/20 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- 手动查询 -->
    <div v-if="activeTab === 'query'" class="card bg-base-100 shadow-sm rounded-tl-none">
      <div class="card-body space-y-4">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">订单号</span>
          <input v-model="orderNo" class="input input-bordered w-full" placeholder="请输入订单号" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">查询凭证</span>
          <input v-model="queryToken" class="input input-bordered w-full" placeholder="请输入查询 token" />
        </label>
        <div class="flex items-center gap-3">
          <AppButton variant="primary" :loading="querying" @click="handleQuery">查询订单</AppButton>
          <span v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../lib/app-error";
import { ref, onMounted } from "vue";
import { useData } from "vike-vue/useData";
import AppButton from "../../components/AppButton.vue";
import { onQueryOrder } from "./queryOrder.telefunc";
import { onSyncLocalOrders } from "./syncLocalOrders.telefunc";
import { getLocalOrders, saveLocalOrders, type LocalOrder } from "../../lib/local-orders";
import { formatCents } from "../../lib/utils/money";
import { formatDateInTimezone } from "../../lib/utils/time";
import StatusTag from "../../components/StatusTag.vue";
import { getOrderStatusLabel, getOrderStatusType } from "../../lib/utils/order-status";
import type { Data } from "./+data";

const { timezone } = useData<Data>();

const activeTab = ref<"local" | "query">("query");
const orderNo = ref("");
const queryToken = ref("");
const errorMessage = ref("");
const querying = ref(false);
const syncingLocalOrders = ref(false);
const localOrders = ref<LocalOrder[]>([]);

onMounted(() => {
  localOrders.value = getLocalOrders();
  refreshLocalOrders();
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(iso: string) {
  return formatDateInTimezone(iso, timezone);
}

function isTerminalLocalOrder(order: LocalOrder) {
  return (
    order.deliveryStatus === "DELIVERED" ||
    order.deliveryStatus === "FAILED" ||
    order.status === "CLOSED" ||
    order.status === "FAILED" ||
    order.paymentStatus === "FAILED"
  );
}

async function refreshLocalOrders(minLoadingMs = 0) {
  if (!localOrders.value.length || syncingLocalOrders.value) return;

  const pendingOrders = localOrders.value.filter((order) => !isTerminalLocalOrder(order));
  if (!pendingOrders.length) return;

  syncingLocalOrders.value = true;
  try {
    const syncPromise = onSyncLocalOrders({
      orders: pendingOrders.map((order) => ({
        orderNo: order.orderNo,
        queryToken: order.queryToken,
      })),
    });

    const [remoteOrders] = await Promise.all([
      syncPromise,
      minLoadingMs > 0 ? wait(minLoadingMs) : Promise.resolve(),
    ]);

    const remoteMap = new Map(remoteOrders.map((order) => [order.orderNo, order]));
    const merged = localOrders.value.map((order) => {
      const remote = remoteMap.get(order.orderNo);
      return remote ? { ...order, ...remote, updatedAt: new Date().toISOString() } : order;
    });

    localOrders.value = merged;
    saveLocalOrders(merged);
  } catch {
    // 本地订单缓存刷新失败不影响手动查询和进入订单详情。
  } finally {
    syncingLocalOrders.value = false;
  }
}

function handleRefreshLocalOrders() {
  refreshLocalOrders(3000);
}

async function handleQuery() {
  errorMessage.value = "";
  querying.value = true;

  try {
    const result = await onQueryOrder({
      orderNo: orderNo.value,
      queryToken: queryToken.value,
    });

    if (!result) {
      errorMessage.value = "未找到匹配订单，请检查订单号和查询凭证。";
      return;
    }

    window.location.href = `/order/${result.orderNo}?token=${encodeURIComponent(queryToken.value)}`;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "查询失败");
  } finally {
    querying.value = false;
  }
}
</script>
