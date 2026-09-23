import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";

// 声明全局 window 上的 grecaptcha 类型定义
declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

// 表单数据接口
interface FormDataState {
  fullname: string;
  phone: string;
  email: string;
  services: string;
  description: string;
}

// 错误信息接口
interface FormErrors {
  email?: string;
  services?: string;
}

// 提交状态类型
type SubmitStatus = "success" | "error" | null;

export const InquiryForm: React.FC = () => {
  const SITE_KEY = "6Ld3y2UgAAAAAIyIHi3qqz2JKlusVl38d9ZFV2E1";

  // 表单状态
  const [formData, setFormData] = useState<FormDataState>({
    fullname: "",
    phone: "",
    email: "",
    services: "",
    description: ""
  });

  // 校验错误状态
  const [errors, setErrors] = useState<FormErrors>({});
  // 提交中状态
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // 提交结果反馈
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

  // 动态加载 Google reCAPTCHA v3/Enterprise 脚本
  useEffect(() => {
    const scriptId = "recaptcha-v3-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [SITE_KEY]);

  // 处理输入变化
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 实时清除对应字段的错误信息
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 表单验证逻辑
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 验证 Email
    if (!formData.email.trim()) {
      newErrors.email = "E-mail address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid e-mail address.";
    }

    // 验证 Products or Services
    if (!formData.services.trim()) {
      newErrors.services = "Products or Services Interested is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交动作
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      let captchaToken = "";

      // 获取 reCAPTCHA Token
      if (window.grecaptcha?.enterprise) {
        captchaToken = await new Promise<string>((resolve) => {
          window.grecaptcha?.enterprise?.ready(async () => {
            const token = await window.grecaptcha?.enterprise?.execute(SITE_KEY, { action: "submit" });
            resolve(token || "");
          });
        });
      }

      // 封装表单提交数据 (与原有 POST 格式对齐)
      const payload = new URLSearchParams({
        fullname: formData.fullname,
        phone: formData.phone,
        email: formData.email,
        services: formData.services,
        description: formData.description,
        "g-recaptcha-response": captchaToken,
        act: "send",
        AddTime: "2021-08-25 01:16:49"
      });

      // 发送请求
      const response = await fetch("https://www.drosophilidae.org/pub.html", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
      });

      if (response.ok) {
        setSubmitStatus("success");
        // 重置表单
        setFormData({
          fullname: "",
          phone: "",
          email: "",
          services: "",
          description: ""
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Inquiry Form</h2>

      {/* 提示信息 */}
      {submitStatus === "success" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Thank you! Your inquiry has been submitted successfully.
        </div>
      )}
      {submitStatus === "error" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">Failed to submit inquiry. Please try again later.</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="fullname"
            name="fullname"
            placeholder="Your Name"
            value={formData.fullname}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 placeholder-gray-400 outline-none text-sm"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 placeholder-gray-400 outline-none text-sm"
          />
        </div>

        {/* E-mail Address */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="text-red-500 font-bold mr-1">*</span>E-mail Address
          </label>
          <input
            type="text"
            id="email"
            name="email"
            placeholder="E-mail Address"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-lg border transition-colors text-gray-800 placeholder-gray-400 outline-none text-sm ${
              errors.email ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Products or Services Interested */}
        <div>
          <label htmlFor="Servicesp" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="text-red-500 font-bold mr-1">*</span>Products or Services Interested
          </label>
          <input
            type="text"
            id="Servicesp"
            name="services"
            placeholder="Products or Services Interested"
            value={formData.services}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-lg border transition-colors text-gray-800 placeholder-gray-400 outline-none text-sm ${
              errors.services ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {errors.services && <p className="mt-1 text-xs text-red-500">{errors.services}</p>}
        </div>

        {/* Project Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Project Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Project Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 placeholder-gray-400 outline-none text-sm resize-y"
          />
        </div>

        {/* 提交按钮 */}
        <div className="pt-2 flex justify-start">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-36 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InquiryForm;
