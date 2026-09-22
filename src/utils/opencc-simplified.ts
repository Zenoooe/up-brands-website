type OpenCCModule = {
  Converter: (options: { from: string; to: string }) => (input: string) => string;
};

let simplifiedConverterPromise: Promise<(input: string) => string> | null = null;

async function getSimplifiedConverter() {
  if (!simplifiedConverterPromise) {
    simplifiedConverterPromise = import('opencc-js/t2cn').then((module: OpenCCModule) =>
      module.Converter({ from: 'hk', to: 'cn' }),
    );
  }

  return simplifiedConverterPromise;
}

export async function toSimplifiedChinese(text: string) {
  if (!text) {
    return text;
  }

  try {
    const converter = await getSimplifiedConverter();
    return converter(text);
  } catch (error) {
    console.warn('OpenCC conversion failed for hk -> cn', error);
    return text;
  }
}
