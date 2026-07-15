<template>
  <div class="space-y-10">

    <!-- Hero 区域 -->
    <section class="relative">
      <div class="relative rounded-2xl bg-base-100 shadow-md overflow-hidden border border-base-200/60">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl"></div>
          <div class="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary/5 to-transparent blur-2xl"></div>
        </div>

        <div class="relative flex flex-col gap-8 px-8 py-10 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
          <!-- 左侧 -->
          <div class="space-y-4 max-w-lg">
            <div class="inline-flex items-center gap-2 badge badge-primary badge-outline font-semibold tracking-widest uppercase">
              {{ site.siteSubtitle || 'Welcome' }}
            </div>
            <p v-if="site.notice" class="text-sm text-base-content/60 leading-relaxed border-l-2 border-primary/40 pl-4">
              {{ site.notice }}
            </p>
          </div>

          <!-- 右侧统计 -->
          <div class="flex items-center gap-5 shrink-0">
            <div class="flex items-center gap-3 rounded-xl bg-gradient-to-br from-secondary/10 to-base-200 px-5 py-4 shadow-sm">
              <div class="flex flex-col items-center">
                <span class="text-xs text-base-content/50 font-medium mb-1">在售商品</span>
                <span class="text-3xl font-bold text-secondary leading-none">{{ catalog.total }}</span>
              </div>
              <div class="flex items-center justify-center size-11 rounded-xl bg-secondary/15 text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 商品列表 -->
    <section class="space-y-5">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold text-base-content">商品列表</h2>
        <span v-if="filteredProducts.length" class="text-xs text-base-content/40 font-medium">共 {{ filteredProducts.length }} 件</span>
      </div>

      <!-- 分类筛选 -->
      <div v-if="catalog.categories.length" class="flex flex-wrap gap-2">
        <button
          class="btn btn-sm rounded-full px-4 transition-all duration-200"
          :class="activeCategoryId === null ? 'btn-primary shadow-sm shadow-primary/20' : 'btn-ghost border border-base-300 hover:border-primary/40 hover:text-primary'"
          @click="activeCategoryId = null"
        >
          全部商品
        </button>
        <button
          v-for="category in catalog.categories"
          :key="category.id"
          class="btn btn-sm rounded-full px-4 transition-all duration-200"
          :class="activeCategoryId === category.id ? 'btn-primary shadow-sm shadow-primary/20' : 'btn-ghost border border-base-300 hover:border-primary/40 hover:text-primary'"
          @click="activeCategoryId = category.id"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- 商品网格 -->
      <div v-if="filteredProducts.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          class="card bg-base-100 rounded-xl overflow-hidden border border-base-300/50 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-base-content/8 group"
          @click="navigateToProduct(product.slug)"
        >
          <!-- 商品图片 -->
          <figure class="relative aspect-square overflow-hidden bg-base-200 !m-0">
            <img
              :src="product.coverImage || emptyCoverUrl"
              :alt="product.name"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <!-- 分类标签 -->
            <div class="absolute top-3 left-3">
              <span class="badge badge-sm font-medium rounded-md bg-base-100/85 backdrop-blur-sm border-0 text-base-content shadow-sm">
                {{ product.categoryName || '默认' }}
              </span>
            </div>
          </figure>

          <!-- 商品信息 -->
          <div class="card-body p-4 gap-2.5">
            <!-- 商品名称 -->
            <h3 class="text-sm font-semibold line-clamp-2 text-base-content leading-snug">
              {{ product.name }}
            </h3>

            <!-- 底部：状态 + 价格 -->
            <div class="flex items-end justify-between mt-auto">
              <span
                v-if="product.deliveryType === 'CARD_AUTO'"
                class="text-xs font-semibold px-2 py-0.5 rounded"
                :class="{
                  'bg-amber-500/10 text-amber-600': lowStock(product),
                  'bg-emerald-500/10 text-emerald-600': !lowStock(product) && product.availableStock > 0,
                  'bg-red-50 text-red-500': product.availableStock === 0
                }"
              >
                {{ product.availableStock === 0 ? '已售罄' : lowStock(product) ? `紧张(${product.availableStock})` : '有货' }}
              </span>
              <span
                v-else-if="product.deliveryType === 'FIXED_CARD'"
                class="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600"
              >
                有货
              </span>
              <span
                v-else-if="product.deliveryType === 'MANUAL'"
                class="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600"
              >
                人工发货
              </span>
              <span
                v-else-if="product.deliveryType === 'EXPRESS'"
                class="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-600"
              >
                实体商品
              </span>
              <div class="flex items-baseline gap-0.5">
                <span class="text-[11px] font-bold text-red-500/60">¥</span>
                <span class="text-xl font-bold text-red-500 leading-none">{{ formatCents(product.price) }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-12 text-center text-base-content/40">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p class="text-sm">当前还没有上架商品</p>
        <p class="text-xs mt-1 opacity-60">请先在后台录入分类、商品和库存</p>
      </div>

      <!-- 加载更多触发器和状态 -->
      <div v-if="filteredProducts.length > 0" ref="sentinelRef" class="py-8 text-center">
        <div v-if="loading" class="flex items-center justify-center gap-2 text-base-content/60">
          <span class="loading loading-spinner loading-sm"></span>
          <span>加载中...</span>
        </div>
        <div v-else-if="!hasMore" class="text-base-content/40 text-sm">
          已加载全部商品
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, useTemplateRef } from "vue";
import { useData } from "vike-vue/useData";
import { navigate } from "vike/client/router";
import { formatCents } from "../../lib/utils/money";
import emptyCoverUrl from "../../assets/empty.jpg";
import { onLoadMoreProducts } from "./loadMoreProducts.telefunc";
import type { Data } from "./+data";
import type { ProductSummary } from "../../modules/catalog/types";

const { site, catalog } = useData<Data>();
const activeCategoryId = ref<number | null>(null);
const products = ref<ProductSummary[]>([...catalog.products]);
const total = ref(catalog.total);
const loading = ref(false);
const sentinelRef = useTemplateRef<HTMLElement>("sentinelRef");
let observer: IntersectionObserver | null = null;

const filteredProducts = computed(() => {
  if (activeCategoryId.value === null) {
    return products.value;
  }

  return products.value.filter((product) => product.categoryId === activeCategoryId.value);
});

const hasMore = computed(() => products.value.length < total.value);

// 库存紧张
const lowStock = (product: ProductSummary) => {
  return product.availableStock >= 0 && product.availableStock < 10
}

// 跳转到商品详情页
const navigateToProduct = (slug: string) => {
  navigate(`/product/${slug}`);
}

// 加载更多商品
async function loadMore() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const result = await onLoadMoreProducts({
      skip: products.value.length,
      take: 16,
      categoryId: activeCategoryId.value,
    });
    products.value.push(...result.items);
    total.value = result.total;
  } catch (error) {
    console.error("加载商品失败:", error);
  } finally {
    loading.value = false;
  }
}

// 切换分类时重置列表
watch(activeCategoryId, async (newCategoryId) => {
  loading.value = true;
  try {
    const result = await onLoadMoreProducts({
      skip: 0,
      take: 16,
      categoryId: newCategoryId,
    });
    products.value = result.items;
    total.value = result.total;
  } catch (error) {
    console.error("加载商品失败:", error);
  } finally {
    loading.value = false;
  }
});

// 设置 Intersection Observer
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
        loadMore();
      }
    },
    { threshold: 0.1 },
  );

  // 初始观察
  if (sentinelRef.value) {
    observer.observe(sentinelRef.value);
  }
});

// 监听 sentinelRef 变化，确保 observer 能正确观察
watch(sentinelRef, (newEl, oldEl) => {
  if (observer) {
    if (oldEl) observer.unobserve(oldEl);
    if (newEl) observer.observe(newEl);
  }
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>
