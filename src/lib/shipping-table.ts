export type TableShippingQuote = {
  serviceId: number;
  name: string;
  company: string;
  priceCents: number;
  days: number;
};

export function tableShippingQuotes(destinationCep: string): TableShippingQuote[] {
  const prefix = Number(destinationCep.replace(/\D/g, "").slice(0, 2));
  let pac = 3290;
  let sedex = 4990;
  let pacDays = 10;
  let sedexDays = 4;
  if (prefix >= 1 && prefix <= 19) {
    pac = 1990;
    sedex = 2990;
    pacDays = 5;
    sedexDays = 2;
  } else if ((prefix >= 20 && prefix <= 28) || (prefix >= 30 && prefix <= 39)) {
    pac = 2490;
    sedex = 3890;
    pacDays = 7;
    sedexDays = 3;
  } else if (prefix >= 80 && prefix <= 89) {
    pac = 2890;
    sedex = 4290;
    pacDays = 8;
    sedexDays = 3;
  } else if (prefix >= 40 && prefix <= 65) {
    pac = 3490;
    sedex = 5290;
    pacDays = 10;
    sedexDays = 4;
  } else if (prefix >= 66 && prefix <= 79) {
    pac = 3890;
    sedex = 5690;
    pacDays = 12;
    sedexDays = 5;
  }
  return [
    { serviceId: 1, name: "PAC", company: "Correios", priceCents: pac, days: pacDays },
    { serviceId: 2, name: "SEDEX", company: "Correios", priceCents: sedex, days: sedexDays },
  ];
}
