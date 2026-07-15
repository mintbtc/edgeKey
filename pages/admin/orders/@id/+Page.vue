<template>
  <section v-if="!order" class="alert alert-warning">订单不存在。</section>
  <section v-else class="space-y-6">
    <article class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-3">
        <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h1 class="text-2xl font-bold">订单详情 #{{ order.id }}</h1>
            <p class="text-sm text-base-content/70">订单号：{{ order.orderNo }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <StatusTag :type="getOrderStatusType(order.status)">{{ getOrderStatusLabel(order.status) }}</StatusTag>
            <StatusTag :type="getPaymentStatusType(order.paymentStatus)">{{ getPaymentStatusLabel(order.paymentStatus) }}</StatusTag>
            <StatusTag :type="getDeliveryStatusType(order.deliveryStatus)">{{ getDeliveryStatusLabel(order.deliveryStatus) }}</StatusTag>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-1 text-sm">
            <div>商品：{{ order.productName }}</div>
            <div>数量：{{ order.quantity }}</div>
            <div>商品总价：{{ formatCents(order.originalAmount || order.amount) }}</div>
            <div v-if="order.discountCodeStr">折扣码：{{ order.discountCodeStr }}</div>
            <div v-if="order.discountAmount" class="text-orange-400">折扣优惠：-{{ formatCents(order.discountAmount) }}</div>
            <div class="font-bold">实付金额：{{ formatCents(order.amount) }}</div>
            <div>支付方式：{{ getPaymentProviderLabel(order.paymentProvider) }}</div>
          </div>
          <div class="space-y-1 text-sm">
            <div>联系方式：{{ order.contactValue || '-' }}</div>
            <div v-if="order.receiverInfo">收货信息：{{ order.receiverInfo }}</div>
            <div>备注：{{ order.buyerNote || '-' }}</div>
            <div>创建时间：{{ formatDate(order.createdAt) }}</div>
            <div>查询凭证：<code>{{ order.queryToken }}</code></div>
          </div>
        </div>
        <div v-if="(order.productDeliveryType === 'MANUAL' || order.productDeliveryType === 'EXPRESS') && order.paymentStatus === 'PAID' && order.deliveryStatus !== 'DELIVERED'" class="pt-2">
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">{{ order.productDeliveryType === 'EXPRESS' ? '快递发货内容' : '手动发货内容' }}</span>
            <textarea v-model="manualDeliveryContent" class="textarea textarea-bordered w-full" rows="4" :placeholder="order.productDeliveryType === 'EXPRESS' ? '例如：快递单号、快递公司等物流信息' : '例如：账号密码、激活码等买家需要的内容'"></textarea>
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <AppButton size="sm" variant="primary" :loading="delivering" :disabled="order.deliveryStatus === 'DELIVERED' || order.paymentStatus !== 'PAID'" @click="handleRedeliver">{{ deliveryActionLabel }}</AppButton>
          <AppButton size="sm" variant="outline" :loading="closing" :disabled="order.status === 'CLOSED'" @click="handleClose">关闭订单</AppButton>
          <span v-if="actionMessage" class="text-sm text-success">{{ actionMessage }}</span>
          <span v-if="actionError" class="text-sm text-error">{{ actionError }}</span>
        </div>
      </div>
    </article>

    <article class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">发货记录</h2>
        <div v-if="order.deliveries.length" class="space-y-3">
          <div v-for="item in order.deliveries" :key="item.id" class="rounded-box bg-base-200 p-3 text-sm">
            <div>{{ item.contentSnapshot }}</div>
            <div class="mt-1 text-xs text-base-content/60">{{ formatDate(item.createdAt) }}</div>
          </div>
        </div>
        <p v-else class="text-sm text-base-content/60">暂无发货记录。</p>
      </div>
    </article>

    <article class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">支付日志</h2>
        <div v-if="order.paymentLogs.length" class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="log in order.paymentLogs" :key="log.id" class="rounded-box bg-base-200 p-3 text-sm">
            <div class="flex items-center justify-between gap-2">
              <div class="font-medium">{{ log.eventType }}</div>
              <button v-if="log.rawPayload" class="btn btn-xs btn-ghost" @click="openRawPayload(log.rawPayload)">详情</button>
            </div>
            <div class="text-xs text-base-content/60">{{ getVerifyStatusLabel(log.verifyStatus) }} · {{ formatDate(log.createdAt) }}</div>
            <div v-if="log.message" class="mt-1">{{ log.message }}</div>
          </div>
        </div>
        <p v-else class="text-sm text-base-content/60">暂无支付日志。</p>

        <dialog ref="payloadDialogRef" class="modal">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-3">原始 Payload</h3>
            <pre class="bg-base-200 rounded-box p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">{{ formattedPayload }}</pre>
            <div class="modal-action">
              <form method="dialog"><button class="btn btn-sm">关闭</button></form>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop"><button>关闭</button></form>
        </dialog>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../../lib/app-error";
import { computed, ref } from "vue";
import { useData } from "vike-vue/useData";
import { formatCents } from "../../../../lib/utils/money";
import {
  getDeliveryStatusLabel,
  getDeliveryStatusType,
  getOrderStatusLabel,
  getOrderStatusType,
  getPaymentProviderLabel,
  getPaymentStatusLabel,
  getPaymentStatusType,
  getVerifyStatusLabel,
} from "../../../../lib/utils/order-status";
import StatusTag from "../../../../components/StatusTag.vue";
import AppButton from "../../../../components/AppButton.vue";
import { onCloseOrder } from "./closeOrder.telefunc";
import { onRedeliver } from "./redeliver.telefunc";
import type { Data } from "./+data";

const { order } = useData<Data>();
const actionMessage = ref("");
const actionError = ref("");
const delivering = ref(false);
const closing = ref(false);
const manualDeliveryContent = ref("");
const payloadDialogRef = ref<HTMLDialogElement | null>(null);
const formattedPayload = ref("");

const deliveryActionLabel = computed(() => {
  if (!order) return "发货";
  if (order.productDeliveryType === "MANUAL") return "手动发货";
  if (order.productDeliveryType === "EXPRESS") return "快递发货";
  if (order.productDeliveryType === "FIXED_CARD") return "发货固定内容";
  return "重新自动发货";
});

function openRawPayload(raw: string) {
  try {
    formattedPayload.value = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    formattedPayload.value = raw;
  }
  payloadDialogRef.value?.showModal();
}

import { inject } from "vue";
import { SITE_TIMEZONE_KEY, formatDateInTimezone } from "../../../../lib/utils/time";

const timezone = inject(SITE_TIMEZONE_KEY, "Asia/Shanghai");

function formatDate(value: string) {
  return formatDateInTimezone(value, timezone);
}

async function handleRedeliver() {
  if (!order || delivering.value) return;
  actionMessage.value = "";
  actionError.value = "";
  delivering.value = true;

  try {
    const result = await onRedeliver({ orderId: order.id, content: manualDeliveryContent.value });
    order.deliveryStatus = "DELIVERED";
    actionMessage.value = `${deliveryActionLabel.value}完成，共发出 ${result.items.length} 条内容。`;
  } catch (error) {
    actionError.value = normalizeTelefuncError(error, "发货失败");
  } finally {
    delivering.value = false;
  }
}

async function handleClose() {
  if (!order || closing.value) return;
  actionMessage.value = "";
  actionError.value = "";
  closing.value = true;

  try {
    await onCloseOrder({ orderId: order.id });
    order.status = "CLOSED";
    actionMessage.value = "订单已关闭。";
  } catch (error) {
    actionError.value = normalizeTelefuncError(error, "关闭失败");
  } finally {
    closing.value = false;
  }
}
</script>
