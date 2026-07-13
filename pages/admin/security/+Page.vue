<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-6">
      <div>
        <h1 class="text-2xl font-bold">安全设置</h1>
        <p class="mt-2 text-sm text-base-content/70">管理后台登录验证方式，降低账号被爆破或凭据泄露后的风险。</p>
      </div>

      <div role="tablist" class="tabs tabs-bordered">
        <button
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === 'two-factor' }"
          type="button"
          @click="activeTab = 'two-factor'"
        >
          双重认证
        </button>
        <button
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === 'turnstile' }"
          type="button"
          @click="activeTab = 'turnstile'"
        >
          Turnstile
        </button>
      </div>

      <div v-if="alert" role="alert" class="alert" :class="alert.className">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="alert.iconPath" />
        </svg>
        <span>{{ alert.message }}</span>
      </div>

      <div v-if="activeTab === 'two-factor'" class="space-y-6">
        <div v-if="!twoFactorState" class="rounded-box bg-base-200 p-4 text-sm text-base-content/70">
          未获取到管理员安全设置，请重新登录后再试。
        </div>

        <template v-else>
          <div class="alert" :class="twoFactorState.twoFactorEnabled ? 'alert-success' : 'alert-warning'">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span v-if="twoFactorState.twoFactorEnabled">双重认证已启用，登录后台时需要输入验证器 App 中的 6 位验证码。</span>
            <span v-else>双重认证未启用，建议绑定身份验证器 App 后再投入生产使用。</span>
          </div>

          <div v-if="!twoFactorState.twoFactorEnabled" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="space-y-4">
              <div>
                <h2 class="text-lg font-semibold">绑定身份验证器 App</h2>
                <p class="mt-1 text-sm text-base-content/70">使用 Microsoft Authenticator、Google Authenticator、1Password 等支持 TOTP 的应用扫描二维码。</p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <AppButton variant="primary" :loading="setupLoading" @click="handleCreateSetup">生成绑定二维码</AppButton>
                <AppButton v-if="setup" variant="ghost" @click="clearSetup">取消绑定</AppButton>
              </div>

              <div v-if="setup" class="space-y-4">
                <label class="flex flex-col gap-1.5">
                  <span class="label-text font-medium">手动密钥</span>
                  <input :value="setup.secret" class="input input-bordered w-full font-mono text-sm" readonly />
                </label>

                <label class="flex flex-col gap-1.5">
                  <span class="label-text font-medium">验证器验证码</span>
                  <input
                    v-model="enableForm.code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="6"
                    class="input input-bordered w-full"
                    placeholder="请输入 App 中显示的 6 位验证码"
                  />
                </label>

                <AppButton variant="success" :loading="enableLoading" :disabled="enableForm.code.length !== 6" @click="handleEnableTwoFactor">
                  确认启用
                </AppButton>
              </div>
            </div>

            <div v-if="setup" class="rounded-box border border-base-300 bg-base-200 p-4">
              <div class="aspect-square w-full overflow-hidden rounded-box bg-white p-3">
                <img :src="quickChartQrUrl" alt="双重认证绑定二维码" class="h-full w-full object-contain" />
              </div>
              <p class="mt-3 text-xs text-base-content/60">二维码由 QuickChart 生成；您也可以使用左侧手动密钥完成绑定。</p>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="rounded-box bg-base-200 p-4 text-sm text-base-content/70">
              启用时间：{{ twoFactorState.twoFactorEnabledAt ? formatDate(twoFactorState.twoFactorEnabledAt) : '未知' }}
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">当前密码</span>
                <input v-model="disableForm.currentPassword" type="password" class="input input-bordered w-full" placeholder="请输入当前密码" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">验证器验证码</span>
                <input
                  v-model="disableForm.code"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  class="input input-bordered w-full"
                  placeholder="请输入 6 位验证码"
                />
              </label>
            </div>

            <AppButton
              variant="danger"
              :loading="disableLoading"
              :disabled="!disableForm.currentPassword || disableForm.code.length !== 6"
              @click="handleDisableTwoFactor"
            >
              关闭双重认证
            </AppButton>
          </div>
        </template>
      </div>

      <div v-else class="space-y-6">
        <div class="alert" :class="turnstileEnabled ? 'alert-success' : 'alert-warning'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span v-if="turnstileEnabled">Turnstile 已启用 - 登录页已显示人机验证</span>
          <span v-else>Turnstile 未启用 - 请按下方步骤配置</span>
        </div>

        <div class="divider"></div>

        <div class="space-y-6">
          <h2 class="text-lg font-semibold">配置步骤</h2>

          <div class="flex gap-4">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-content">1</div>
            <div class="flex-1 space-y-2">
              <h3 class="font-medium">创建 Turnstile 站点</h3>
              <p class="text-sm text-base-content/70">
                前往
                <a href="https://dash.cloudflare.com/turnstile" target="_blank" class="link link-primary">Cloudflare Dashboard -> Turnstile</a>
                创建站点，获取以下两个密钥：
              </p>
              <div class="mockup-code text-sm">
                <pre><code>TURNSTILE_SITE_KEY   = 前端小组件站点 Key</code></pre>
                <pre><code>TURNSTILE_SECRET_KEY = 服务端校验 Secret Key</code></pre>
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-content">2</div>
            <div class="flex-1 space-y-2">
              <h3 class="font-medium">配置环境变量</h3>
              <p class="text-sm text-base-content/70">使用 wrangler 命令将密钥配置到 Cloudflare Workers：</p>
              <div class="mockup-code text-sm">
                <pre data-prefix="$"><code>wrangler secret put TURNSTILE_SITE_KEY</code></pre>
                <pre data-prefix="$"><code>wrangler secret put TURNSTILE_SECRET_KEY</code></pre>
              </div>
              <div class="alert alert-info text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-5 w-5 shrink-0 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>本地开发时，可在 <code>.env</code> 文件中直接配置这两个变量。</span>
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-content">3</div>
            <div class="flex-1 space-y-2">
              <h3 class="font-medium">完成</h3>
              <p class="text-sm text-base-content/70">配置完成后，刷新此页面查看状态变化。后台登录页会自动显示 Turnstile 小组件，并在服务端强制校验。</p>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="space-y-3">
          <h2 class="text-lg font-semibold">状态说明</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>配置状态</th>
                  <th>行为</th>
                </tr>
              </thead>
              <tbody>
                <tr :class="{ 'bg-base-200': !turnstileEnabled }">
                  <td><span class="badge" :class="turnstileEnabled ? 'badge-ghost' : 'badge-warning'">两个变量都未配置</span></td>
                  <td>Turnstile 默认关闭，不影响现有登录流程</td>
                </tr>
                <tr :class="{ 'bg-base-200': turnstileEnabled }">
                  <td><span class="badge" :class="turnstileEnabled ? 'badge-success' : 'badge-ghost'">两个变量都已配置</span></td>
                  <td>登录页自动显示 Turnstile 小组件，服务端强制校验</td>
                </tr>
                <tr>
                  <td><span class="badge badge-ghost">只配置了一个变量</span></td>
                  <td>系统自动视为未启用，避免半配置状态</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, inject } from "vue";
import { useData } from "vike-vue/useData";
import AppButton from "../../../components/AppButton.vue";
import { normalizeTelefuncError } from "../../../lib/app-error";
import { SITE_TIMEZONE_KEY } from "../../../lib/utils/time";
import type { Data } from "./+data";
import { onCreateTwoFactorSetup, onDisableTwoFactor, onEnableTwoFactor } from "./twoFactor.telefunc";

const { turnstileEnabled, twoFactor } = useData<Data>();

const activeTab = ref<"two-factor" | "turnstile">("two-factor");
const twoFactorState = ref(twoFactor);
const setup = ref<null | { secret: string; otpauthUrl: string }>(null);
const setupLoading = ref(false);
const enableLoading = ref(false);
const disableLoading = ref(false);
const enableForm = reactive({ code: "" });
const disableForm = reactive({ currentPassword: "", code: "" });
const alert = ref<null | { className: string; iconPath: string; message: string }>(null);

const quickChartQrUrl = computed(() => {
  if (!setup.value) return "";
  const text = encodeURIComponent(setup.value.otpauthUrl);
  return `https://quickchart.io/qr?text=${text}&size=300&ecLevel=M`;
});

function setSuccess(message: string) {
  alert.value = {
    className: "alert-success",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    message,
  };
}

function setError(message: string) {
  alert.value = {
    className: "alert-error",
    iconPath: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    message,
  };
}

function clearSetup() {
  setup.value = null;
  enableForm.code = "";
  alert.value = null;
}

const securityTimezone = inject(SITE_TIMEZONE_KEY, "Asia/Shanghai");

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", { timeZone: securityTimezone, hour12: false });
}

async function handleCreateSetup() {
  setupLoading.value = true;
  alert.value = null;

  try {
    setup.value = await onCreateTwoFactorSetup();
    enableForm.code = "";
  } catch (error) {
    setError(normalizeTelefuncError(error, "生成绑定二维码失败"));
  } finally {
    setupLoading.value = false;
  }
}

async function handleEnableTwoFactor() {
  if (!setup.value) return;
  enableLoading.value = true;
  alert.value = null;

  try {
    const result = await onEnableTwoFactor({ secret: setup.value.secret, code: enableForm.code });
    twoFactorState.value = {
      ...(twoFactorState.value ?? { username: "", twoFactorEnabled: false, twoFactorEnabledAt: null }),
      twoFactorEnabled: result.twoFactorEnabled,
      twoFactorEnabledAt: result.twoFactorEnabledAt,
    };
    setup.value = null;
    enableForm.code = "";
    setSuccess("双重认证已启用。下次登录后台时需要输入验证器验证码。");
  } catch (error) {
    setError(normalizeTelefuncError(error, "启用双重认证失败"));
  } finally {
    enableLoading.value = false;
  }
}

async function handleDisableTwoFactor() {
  disableLoading.value = true;
  alert.value = null;

  try {
    const result = await onDisableTwoFactor({
      currentPassword: disableForm.currentPassword,
      code: disableForm.code,
    });
    twoFactorState.value = {
      ...(twoFactorState.value ?? { username: "", twoFactorEnabled: true, twoFactorEnabledAt: null }),
      twoFactorEnabled: result.twoFactorEnabled,
      twoFactorEnabledAt: result.twoFactorEnabledAt,
    };
    disableForm.currentPassword = "";
    disableForm.code = "";
    setSuccess("双重认证已关闭。");
  } catch (error) {
    setError(normalizeTelefuncError(error, "关闭双重认证失败"));
  } finally {
    disableLoading.value = false;
  }
}
</script>
