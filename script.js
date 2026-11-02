/* NYX — cadastro conectado ao Supabase Edge Function */
"use strict";

const form = document.getElementById("form-id");
const msg = form.querySelector(".msg");
const submitButton = form.querySelector('button[type="submit"]');

async function submitVisitor({ nome, whatsapp, consentimento }) {
  const cfg = window.NYX_CONFIG || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("COLE_AQUI") ||
      !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes("COLE_AQUI")) {
    throw new Error("O cadastro ainda não foi configurado. Aguarde a conexão com o Supabase.");
  }
  if (!window.supabase?.createClient) throw new Error("Não foi possível carregar o serviço de cadastro.");
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const { data, error } = await client.functions.invoke("rapid-processor", {
    body: { nome, whatsapp, consentimento }
  });
  if (error) {
    let detail = "";
    try { detail = (await error.context?.json?.())?.error || ""; } catch {}
    throw new Error(detail || "Não foi possível enviar. Tente novamente mais tarde.");
  }
  if (!data?.ok) throw new Error(data?.error || "Cadastro não confirmado.");
  return data;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  form.querySelectorAll("input").forEach(i => i.removeAttribute("aria-invalid"));
  const nome = form.nome.value.trim();
  const whatsapp = form.whatsapp.value.trim();
  const digits = whatsapp.replace(/\D/g, "");
  const consentimento = form.consentimento.checked;

  if (nome.length < 2) return fail(form.nome, "Informe seu nome.");
  if (digits.length < 10 || digits.length > 15) return fail(form.whatsapp, "Informe um número válido com DDD e código do país.");
  if (!consentimento) return fail(form.consentimento, "É necessário aceitar o aviso de privacidade.");

  submitButton.disabled = true;
  submitButton.textContent = "ENVIANDO...";
  msg.textContent = "";
  try {
    await submitVisitor({ nome, whatsapp, consentimento });
    msg.textContent = "Cadastro recebido! Obrigado por conhecer a NYX.";
    form.reset();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "ENVIAR";
  }
});

function fail(input, text) {
  input.setAttribute("aria-invalid", "true");
  input.focus();
  msg.textContent = text;
}
document.getElementById("ano").textContent = new Date().getFullYear();
