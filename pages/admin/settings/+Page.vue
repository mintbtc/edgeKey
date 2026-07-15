<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 class="text-2xl font-bold">站点设置</h1>
          <p class="text-sm text-base-content/70">维护前台展示的站点名称、公告、客服和下单提示。</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">站点名称</span>
          <input v-model="form.siteName" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">副标题</span>
          <input v-model="form.siteSubtitle" class="input input-bordered w-full" />
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">网站地址</span>
          <input v-model="form.siteUrl" class="input input-bordered w-full" placeholder="https://example.com" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">站点时区</span>
          <select v-model="form.timezone" class="select select-bordered w-full">
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
          </select>
          <span class="text-xs text-base-content/50">影响后台“今日订单”等统计数据的日期分界点</span>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">网站Favicon (ico & png)</span>
          <div class="flex gap-2">
            <input v-model="form.logoIcon" class="input input-bordered w-full" placeholder="https://example.com/favicon.ico" />
            <AppButton variant="outline" @click="openFilePicker('favicon')">选择图片</AppButton>
          </div>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">网站Logo URL</span>
          <div class="flex gap-2">
            <input v-model="form.logo" class="input input-bordered w-full" placeholder="https://example.com/logo.png" />
            <AppButton variant="outline" @click="openFilePicker('logo')">选择图片</AppButton>
          </div>
        </label>
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="label-text font-medium">首页公告</span>
        <textarea v-model="form.notice" class="textarea textarea-bordered w-full" rows="4"></textarea>
      </label>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">客服联系方式</span>
          <textarea v-model="form.supportContact" class="textarea textarea-bordered w-full" rows="3" placeholder="格式：文字|链接（无链接直接填文字）&#10;例：联系客服|https://t.me/123&#10;例：邮件支持|mailto:support@example.com"></textarea>
          <span class="text-xs text-base-content/50">每行一条。纯文字直接填写；需要链接时用 | 分隔，格式：显示文字|链接地址</span>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">页脚文案</span>
          <textarea v-model="form.footerText" class="textarea textarea-bordered w-full" rows="2" placeholder="© 2026 xxxx 版权所有"></textarea>
        </label>
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="label-text font-medium">下单提示</span>
        <textarea v-model="form.orderNotice" class="textarea textarea-bordered w-full" rows="4"></textarea>
      </label>

      <div class="divider">自定义代码</div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">页头代码 (head)</span>
          <textarea v-model="form.headCode" class="textarea textarea-bordered w-full font-mono text-sm" rows="6" placeholder="&lt;meta name=&quot;...&quot; content=&quot;...&quot;&gt;
&lt;script&gt;...&lt;/script&gt;"></textarea>
          <span class="text-xs text-base-content/50">注入到 &lt;head&gt; 标签内，可用于添加统计代码、Meta 标签等</span>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">页脚代码 (body)</span>
          <textarea v-model="form.footerCode" class="textarea textarea-bordered w-full font-mono text-sm" rows="6" placeholder="&lt;script&gt;...&lt;/script&gt;
&lt;div&gt;...&lt;/div&gt;"></textarea>
          <span class="text-xs text-base-content/50">注入到 &lt;/body&gt; 标签前，可用于添加客服插件、JS 脚本等</span>
        </label>
      </div>

      <div class="flex items-center gap-3">
        <AppButton variant="primary" :loading="saving" @click="handleSave">保存设置</AppButton>
        <span v-if="saved" class="text-sm text-success">✓ 已保存</span>
        <span v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</span>
      </div>
    </div>
  </section>
  
  <!-- 文件选择弹窗 -->
  <FilePickerModal
    :show="showFilePicker"
    :type-filter="filePickerTypeFilter"
    @close="showFilePicker = false"
    @select="handleFileSelect"
  />
</template>

<script setup lang="ts">
import AppButton from "../../../components/AppButton.vue";
import FilePickerModal from "../../../components/FilePickerModal.vue";
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref } from "vue";
import { useData } from "vike-vue/useData";
import { onSaveSiteSettings } from "./saveSiteSettings.telefunc";
import type { Data } from "./+data";

const { site } = useData<Data>();

const form = reactive({
  siteName: site.siteName,
  siteUrl: site.siteUrl ?? "",
  siteSubtitle: site.siteSubtitle ?? "",
  logoIcon: site.logoIcon ?? "",
  logo: site.logo ?? "",
  notice: site.notice ?? "",
  supportContact: site.supportContact ?? "",
  footerText: site.footerText ?? "",
  orderNotice: site.orderNotice ?? "",
  headCode: site.headCode ?? "",
  footerCode: site.footerCode ?? "",
  timezone: site.timezone ?? "Asia/Shanghai",
});

const timezones = [
  { value: "Etc/GMT+12", label: "UTC-12" },
  { value: "Pacific/Pago_Pago", label: "太平洋/帕果帕果 (UTC-11)" },
  { value: "Pacific/Honolulu", label: "太平洋/檀香山 (UTC-10)" },
  { value: "Pacific/Marquesas", label: "太平洋/马克萨斯 (UTC-9:30)" },
  { value: "America/Anchorage", label: "美洲/安克雷奇 (UTC-9)" },
  { value: "America/Los_Angeles", label: "美洲/洛杉矶 (UTC-8)" },
  { value: "America/Denver", label: "美洲/丹佛 (UTC-7)" },
  { value: "America/Chicago", label: "美洲/芝加哥 (UTC-6)" },
  { value: "America/New_York", label: "美洲/纽约 (UTC-5)" },
  { value: "America/Caracas", label: "美洲/加拉加斯 (UTC-4:30)" },
  { value: "America/Halifax", label: "美洲/哈利法克斯 (UTC-4)" },
  { value: "America/St_Johns", label: "美洲/圣约翰斯 (UTC-3:30)" },
  { value: "America/Sao_Paulo", label: "美洲/圣保罗 (UTC-3)" },
  { value: "Atlantic/South_Georgia", label: "大西洋/南乔治亚 (UTC-2)" },
  { value: "Atlantic/Azores", label: "大西洋/亚速尔 (UTC-1)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/Berlin", label: "欧洲/柏林 (UTC+1)" },
  { value: "Europe/Athens", label: "欧洲/雅典 (UTC+2)" },
  { value: "Europe/Moscow", label: "欧洲/莫斯科 (UTC+3)" },
  { value: "Asia/Tehran", label: "亚洲/德黑兰 (UTC+3:30)" },
  { value: "Asia/Dubai", label: "亚洲/迪拜 (UTC+4)" },
  { value: "Asia/Kabul", label: "亚洲/喀布尔 (UTC+4:30)" },
  { value: "Asia/Karachi", label: "亚洲/卡拉奇 (UTC+5)" },
  { value: "Asia/Kolkata", label: "亚洲/加尔各答 (UTC+5:30)" },
  { value: "Asia/Kathmandu", label: "亚洲/加德满都 (UTC+5:45)" },
  { value: "Asia/Dhaka", label: "亚洲/达卡 (UTC+6)" },
  { value: "Asia/Yangon", label: "亚洲/仰光 (UTC+6:30)" },
  { value: "Asia/Bangkok", label: "亚洲/曼谷 (UTC+7)" },
  { value: "Asia/Shanghai", label: "亚洲/上海 (UTC+8)" },
  { value: "Australia/Eucla", label: "澳洲/尤克拉 (UTC+8:45)" },
  { value: "Asia/Tokyo", label: "亚洲/东京 (UTC+9)" },
  { value: "Australia/Adelaide", label: "澳洲/阿德莱德 (UTC+9:30)" },
  { value: "Australia/Sydney", label: "澳洲/悉尼 (UTC+10)" },
  { value: "Australia/Lord_Howe", label: "澳洲/豪勋爵 (UTC+10:30)" },
  { value: "Pacific/Noumea", label: "太平洋/努美阿 (UTC+11)" },
  { value: "Pacific/Auckland", label: "太平洋/奥克兰 (UTC+12)" },
  { value: "Pacific/Chatham", label: "太平洋/查塔姆 (UTC+12:45)" },
  { value: "Pacific/Tongatapu", label: "太平洋/汤加塔布 (UTC+13)" },
  { value: "Pacific/Kiritimati", label: "太平洋/圣诞岛 (UTC+14)" },
];

const saving = ref(false);
const saved = ref(false);
const errorMessage = ref("");
const showFilePicker = ref(false);
const filePickerTypeFilter = ref("");
const currentPickerTarget = ref<"" | "logo" | "favicon">("");

async function handleSave() {
  saving.value = true;
  saved.value = false;
  errorMessage.value = "";

  try {
    const result = await onSaveSiteSettings({ ...form });
    form.siteName = result.siteName;
    form.siteUrl = result.siteUrl ?? "";
    form.siteSubtitle = result.siteSubtitle ?? "";
    form.logoIcon = result.logoIcon ?? "";
    form.logo = result.logo ?? "";
    form.notice = result.notice ?? "";
    form.supportContact = result.supportContact ?? "";
    form.footerText = result.footerText ?? "";
    form.orderNotice = result.orderNotice ?? "";
    form.headCode = result.headCode ?? "";
    form.footerCode = result.footerCode ?? "";
    form.timezone = result.timezone ?? "Asia/Shanghai";
    saved.value = true;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    saving.value = false;
  }
}

function openFilePicker(target: "logo" | "favicon") {
  currentPickerTarget.value = target;
  filePickerTypeFilter.value = "image/";
  showFilePicker.value = true;
}

function handleFileSelect(url: string) {
  if (currentPickerTarget.value === "logo") {
    form.logo = url;
  } else if (currentPickerTarget.value === "favicon") {
    form.logoIcon = url;
  }
  showFilePicker.value = false;
}
</script>
