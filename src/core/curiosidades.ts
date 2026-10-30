/**
 * Curiosidades e piadas sobre guitarristas e baixistas, mostradas no rodapé a cada abertura do app.
 * Os fatos são verificáveis; as piadas são só piadas.
 */

export const CURIOSIDADES: Record<'pt' | 'en', string[]> = {
  pt: [
    'Jimi Hendrix tocava canhoto com a guitarra invertida. Ele não estava sendo original: era a única forma que lhe fazia sentido.',
    'B.B. King batizava as suas guitarras de Lucille. Namoro sério com instrumento é outra coisa.',
    'Jaco Pastorius tirou os trastes de um baixo para ter um som mais parecido com o de um contrabaixo acústico.',
    'Jimmy Page tocou com um arco de violino a guitarra em "Dazed and Confused". Violinista, cuidado.',
    'Eddie Van Halen montou a própria guitarra com peças de outras, a "Frankenstrat". Frankenstein também sabe tocar.',
    'Quantos baixistas são precisos para trocar uma lâmpada? Um. O resto da banda fica esperando o refrão.',
    'O guitarrista disse ao baixista: "Eu toco muitas notas". O baixista respondeu: "Eu toco as que importam".',
    'Guitarrista sem afinador é como cozinheiro sem provar a comida: cedo ou tarde alguém reclama.',
    'O baixo é o instrumento que todo mundo sente antes de ouvir. Por isso o baixista chega sempre na hora certa.',
  ],
  en: [
    'Jimi Hendrix played left-handed with the guitar strung upside down. It was not a gimmick: it was the only way that made sense to him.',
    'B.B. King named his guitars Lucille. Serious relationship with an instrument, indeed.',
    'Jaco Pastorius removed the frets from a bass to get a sound closer to an upright bass.',
    'Jimmy Page played a violin bow on the guitar in "Dazed and Confused". Violinists, be careful.',
    'Eddie Van Halen built his own guitar from parts of others, the "Frankenstrat". Frankenstein can play too.',
    'How many bassists does it take to change a light bulb? One. The rest of the band is waiting for the chorus.',
    'The guitarist said to the bassist: "I play a lot of notes." The bassist replied: "I play the ones that matter."',
    'A guitarist without a tuner is like a cook who never tastes the food: sooner or later someone complains.',
    'The bass is the instrument people feel before they hear it. That is why bassists always arrive on time.',
  ],
};

/** Escolhe uma curiosidade no idioma (inglês para os demais idiomas). `rand` existe para testes. */
export function pickCuriosidade(lang: string, rand: () => number = Math.random): string {
  const list = lang === 'pt' ? CURIOSIDADES.pt : CURIOSIDADES.en;
  const i = Math.min(list.length - 1, Math.floor(rand() * list.length));
  return list[i];
}
