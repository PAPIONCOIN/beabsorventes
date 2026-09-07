export const CONTACT_EMAIL = "beabsorventes@gmail.com";
export const CONTACT_PHONE_DISPLAY = "+55 11 99589-5103";
export const CONTACT_PHONE_E164 = "5511995895103";
export const CONTACT_WHATSAPP = `https://wa.me/${CONTACT_PHONE_E164}`;

export const CONTACT_TOPICS = [
  "Dúvida sobre peças",
  "Pedido",
  "Troca ou ajuste",
  "Atacado",
  "Outro",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export function whatsappMessageUrl(input: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}) {
  const lines = [
    `Olá, sou ${input.name}.`,
    `E-mail: ${input.email}`,
    input.phone ? `Telefone: ${input.phone}` : null,
    `Assunto: ${input.topic}`,
    "",
    input.message,
  ].filter((line): line is string => line !== null);

  return `https://api.whatsapp.com/send?phone=${CONTACT_PHONE_E164}&text=${encodeURIComponent(lines.join("\n"))}`;
}
