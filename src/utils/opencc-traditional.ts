type OpenCCModule = {
  Converter: (options: { from: string; to: string }) => (input: string) => string;
};

let traditionalConverterPromise: Promise<(input: string) => string> | null = null;

async function getTraditionalConverter() {
  if (!traditionalConverterPromise) {
    traditionalConverterPromise = import('opencc-js/cn2t').then((module: OpenCCModule) =>
      module.Converter({ from: 'cn', to: 'tw' }),
    );
  }

  return traditionalConverterPromise;
}

export async function toTraditionalChinese(text: string) {
  if (!text) {
    return text;
  }

  try {
    const converter = await getTraditionalConverter();
    return converter(text);
  } catch (error) {
    console.warn('OpenCC conversion failed for cn -> tw', error);
    return text;
  }
}
