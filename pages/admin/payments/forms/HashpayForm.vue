<template>
  <div class="space-y-4">
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">商户 ID</span>
      <input v-model="modelValue.hashpayMerchantId" class="input input-bordered w-full" placeholder="489d9970-d5f8-47d1-8e86-d8c1ca3221fd" />
      <p class="text-xs text-base-content/60">在 HashPay 后台商户列表中获取，格式为 UUID。</p>
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">商户 RSA 私钥</span>
      <textarea v-model="modelValue.hashpayPrivateKey" class="textarea textarea-bordered w-full font-mono text-xs" rows="6" placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" />
      <p class="text-xs text-base-content/60">
        在 HashPay 后台创建商户时生成的 RSA 私钥（PKCS#8 格式），用于签名请求和解密回调通知。创建时只显示一次，请妥善保管。
      </p>
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">货币代码</span>
      <input v-model="modelValue.hashpayCurrency" class="input input-bordered w-full" placeholder="CNY" />
      <p class="text-xs text-base-content/60">ISO 4217 货币代码，如 CNY、USD、HKD，默认 CNY</p>
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: Record<string, any> }>();
</script>
