<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div>
        <h1 class="text-2xl font-bold">{{ title }}</h1>
        <p class="text-sm text-base-content/70">商品保存已接入真实数据库写入。</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">商品名称</span>
          <input v-model="form.name" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">Slug</span>
          <input v-model="form.slug" class="input input-bordered w-full" placeholder="留空则自动生成" />
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">分类</span>
          <select v-model="form.categoryId" class="select select-bordered w-full">
            <option value="">未分类</option>
            <option v-for="category in categories" :key="category.id" :value="String(category.id)">
              {{ category.name }}
            </option>
          </select>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">价格（分）</span>
          <input v-model.number="form.price" type="number" min="0" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">状态</span>
          <select v-model="form.status" class="select select-bordered w-full">
            <option value="ACTIVE">上架</option>
            <option value="INACTIVE">下架</option>
            <option value="DRAFT">草稿</option>
          </select>
        </label>
      </div>

      <div class="space-y-3 rounded-box border border-base-200 p-4">
        <div>
          <div class="text-sm font-medium">发货方式</div>
          <p class="text-xs text-base-content/60">发货方式决定库存来源和支付后的发货动作。</p>
        </div>
        <div class="grid gap-3 md:grid-cols-4">
          <label class="rounded-box border border-base-300 p-3" :class="form.deliveryType === 'CARD_AUTO' ? 'border-primary bg-primary/5' : ''">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium">自动发货卡密</span>
              <input v-model="form.deliveryType" type="radio" class="radio radio-primary radio-sm" value="CARD_AUTO" />
            </div>
            <p class="mt-1 text-xs text-base-content/60">从卡密库存中自动分配未售卡密。</p>
          </label>
          <label class="rounded-box border border-base-300 p-3" :class="form.deliveryType === 'FIXED_CARD' ? 'border-primary bg-primary/5' : ''">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium">固定内容自动发货</span>
              <input v-model="form.deliveryType" type="radio" class="radio radio-primary radio-sm" value="FIXED_CARD" />
            </div>
            <p class="mt-1 text-xs text-base-content/60">每次支付后发送同一份固定内容，不使用卡密库存。</p>
          </label>
          <label class="rounded-box border border-base-300 p-3" :class="form.deliveryType === 'MANUAL' ? 'border-primary bg-primary/5' : ''">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium">手动发货</span>
              <input v-model="form.deliveryType" type="radio" class="radio radio-primary radio-sm" value="MANUAL" />
            </div>
            <p class="mt-1 text-xs text-base-content/60">支付后等待管理员在订单详情填写发货内容。</p>
          </label>
          <label class="rounded-box border border-base-300 p-3" :class="form.deliveryType === 'EXPRESS' ? 'border-primary bg-primary/5' : ''">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium">快递发货</span>
              <input v-model="form.deliveryType" type="radio" class="radio radio-primary radio-sm" value="EXPRESS" />
            </div>
            <p class="mt-1 text-xs text-base-content/60">买家下单时填写收货信息，支付后管理员安排快递发货。</p>
          </label>
        </div>
        <label v-if="form.deliveryType === 'FIXED_CARD'" class="flex flex-col gap-1.5">
          <span class="label-text font-medium">固定发货内容</span>
          <textarea v-model="form.fixedDeliveryContent" class="textarea textarea-bordered w-full" rows="5" placeholder="买家支付后会收到这段固定内容"></textarea>
        </label>
        <label v-if="form.deliveryType === 'MANUAL'" class="flex flex-col gap-1.5">
          <span class="label-text font-medium">手动发货说明（可选）</span>
          <textarea v-model="form.manualDeliveryHint" class="textarea textarea-bordered w-full" rows="3" placeholder="例如：请留下账号信息，管理员将在 24 小时内处理"></textarea>
        </label>
        <label v-if="form.deliveryType === 'EXPRESS'" class="flex flex-col gap-1.5">
          <span class="label-text font-medium">快递发货说明（可选）</span>
          <textarea v-model="form.manualDeliveryHint" class="textarea textarea-bordered w-full" rows="3" placeholder="例如：请填写收货地址，管理员将在 48 小时内安排发货"></textarea>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">最小购买数</span>
          <input v-model.number="form.minBuy" type="number" min="1" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">最大购买数</span>
          <input v-model.number="form.maxBuy" type="number" min="1" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">排序</span>
          <input v-model.number="form.sort" type="number" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">价格预览</span>
          <div class="input input-bordered w-full flex items-center text-sm text-base-content/70">{{ formatCents(form.price || 0) }}</div>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">副标题</span>
          <input v-model="form.subtitle" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">商品封面（图片链接）</span>
          <div class="flex gap-2">
            <input v-model="form.coverImage" class="input input-bordered w-full" placeholder="https://..." />
            <AppButton variant="outline" @click="showFilePicker = true">选择图片</AppButton>
          </div>
        </label>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="label-text font-medium">商品描述</span>
        <RichTextEditor v-model="form.description" />
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="label-text font-medium">购买须知</span>
        <textarea v-model="form.purchaseNote" class="textarea textarea-bordered w-full" rows="4"></textarea>
      </label>

      <div class="flex items-center gap-3">
        <AppButton variant="primary" :loading="saving" @click="handleSave">保存商品</AppButton>
        <AppButton href="/admin/products" variant="ghost">返回列表</AppButton>
        <span v-if="saved" class="badge badge-success">已保存</span>
        <span v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</span>
      </div>
    </div>
  </section>

  <FilePickerModal
    :show="showFilePicker"
    type-filter="image/"
    @close="showFilePicker = false"
    @select="handleFileSelect"
  />
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref } from "vue";
import AppButton from "../../../components/AppButton.vue";
import FilePickerModal from "../../../components/FilePickerModal.vue";
import { formatCents } from "../../../lib/utils/money";
import RichTextEditor from "./RichTextEditor.vue";
import { onSaveProduct } from "./saveProduct.telefunc";
import { createProductFormState, type ProductFormState } from "./form";

const props = defineProps<{
  title: string;
  categories: Array<{ id: number; name: string }>;
  initialValue?: Partial<ProductFormState>;
}>();

const form = reactive(createProductFormState(props.initialValue));
const saving = ref(false);
const saved = ref(false);
const errorMessage = ref("");
const showFilePicker = ref(false);

async function handleSave() {
  saving.value = true;
  saved.value = false;
  errorMessage.value = "";

  try {
    const result = await onSaveProduct({
      id: form.id,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      name: form.name,
      slug: form.slug,
      subtitle: form.subtitle,
      coverImage: form.coverImage,
      description: form.description,
      price: form.price,
      status: form.status,
      deliveryType: form.deliveryType,
      fixedDeliveryContent: form.fixedDeliveryContent,
      manualDeliveryHint: form.manualDeliveryHint,
      minBuy: form.minBuy,
      maxBuy: form.maxBuy,
      sort: form.sort,
      purchaseNote: form.purchaseNote,
    });

    form.id = result.id;
    form.categoryId = result.categoryId ? String(result.categoryId) : "";
    form.name = result.name;
    form.slug = result.slug;
    form.subtitle = result.subtitle ?? "";
    form.coverImage = result.coverImage ?? "";
    form.description = result.description ?? "";
    form.price = result.price;
    form.status = result.status;
    form.deliveryType = result.deliveryType;
    form.fixedDeliveryContent = result.fixedDeliveryContent ?? "";
    form.manualDeliveryHint = result.manualDeliveryHint ?? "";
    form.minBuy = result.minBuy;
    form.maxBuy = result.maxBuy;
    form.sort = result.sort;
    form.purchaseNote = result.purchaseNote ?? "";
    saved.value = true;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    saving.value = false;
  }
}

function handleFileSelect(url: string) {
  form.coverImage = url;
  showFilePicker.value = false;
}
</script>
