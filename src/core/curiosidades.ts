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
    'Eric Clapton montou a guitarra "Blackie" a partir de três Stratocasters diferentes.',
    'Django Reinhardt, depois de um incêndio que deixou dois dedos da mão esquerda sem movimento, criou um estilo único e famoso.',
    'Paul McCartney tocou por anos com um baixo Hofner de corpo em forma de violino, leve e fácil de girar.',
    'Les Paul ajudou a criar a guitarra elétrica de corpo sólido que hoje leva o seu nome.',
    'O primeiro baixo elétrico de produção em massa, o Precision Bass, foi lançado pela Fender em 1951.',
    'O baixo tem a mesma afinação das quatro cordas mais graves da guitarra, só que uma oitava abaixo.',
    'A afinação padrão da guitarra é E A D G B E. Entre as cordas, o intervalo é de quarta em quase todos os casos; só entre G e B é terça.',
    'Cada traste sobe um semitom. Doze trastes depois, a nota da corda solta volta, uma oitava acima.',
    'Os trastes ficam cada vez mais juntos à medida que você sobe no braço: a distância diminui uns 6% a cada casa.',
    'O lá central (A4) vibra a 440 Hz no padrão internacional. O afinador do app usa essa referência, ajustável de 430 a 450 Hz.',
    'A escala pentatônica, com só cinco notas, aparece em uma enorme quantidade de músicas de blues e rock.',
    'O violão clássico usa cordas de nylon, e o violão de aço usa cordas de aço. O som e a pegada mudam bastante.',
    'A pestana é o movimento de prender várias cordas com um dedo só. O acorde de Fá maior é o exemplo mais famoso.',
    'O nome do ukulele é popularmente traduzido do havaiano como "pulga que salta". A origem exata é debatida.',
    'Muitos solos memoráveis têm mais silêncio do que notas. Deixar a nota respirar também faz parte da música.',
    'O ScaleMonster toca cada nota na frequência exata da corda e do traste. Não é um arquivo de áudio: é síntese de som.',
    'Subir o andamento aos poucos é uma das formas mais eficientes de aprender uma escala. Ative o aumento automático nos ajustes.',
    'Quantos guitarristas são precisos para trocar uma corda? Três: um troca, dois dizem que a antiga soava melhor.',
    'Quantos baixistas são precisos para trocar uma lâmpada? Um. O resto da banda fica esperando o refrão.',
    'O guitarrista disse ao baixista: "Eu toco muitas notas". O baixista respondeu: "Eu toco as que importam".',
    'Guitarrista sem afinador é como cozinheiro que nunca prova a comida: cedo ou tarde alguém reclama.',
    'O baixo é o instrumento que todo mundo sente antes de ouvir. Por isso o baixista chega sempre na hora certa.',
    'O metrônomo nunca reclama, mas também nunca concorda com você. Dá para aprender muito com essa franqueza.',
    'O baterista perguntou ao baixista: "Você está adiantado?". Ele respondeu: "Não, o relógio é que está atrasado".',
    'Um guitarrista de blues com só cinco notas no bolso ainda consegue fazer a plateia inteira sentir o solo.',
    'Uma escala é só um mapa. A música acontece quando você decide para onde ir nele.',
  ],
  en: [
    'Jimi Hendrix played left-handed with the guitar strung upside down. It was not a gimmick: it was the only way that made sense to him.',
    'B.B. King named his guitars Lucille. Serious relationship with an instrument, indeed.',
    'Jaco Pastorius removed the frets from a bass to get a sound closer to an upright bass.',
    'Jimmy Page played a violin bow on the guitar in "Dazed and Confused". Violinists, be careful.',
    'Eddie Van Halen built his own guitar from parts of others, the "Frankenstrat". Frankenstein can play too.',
    'Eric Clapton built his guitar "Blackie" from three different Stratocasters.',
    'Django Reinhardt, after a fire left two fingers of his left hand unusable, built a famous and unique style.',
    'Paul McCartney played for years on a Hofner bass with a violin-shaped body, light and easy to swing.',
    'Les Paul helped create the solid-body electric guitar that now carries his name.',
    'The first mass-produced electric bass, the Precision Bass, was released by Fender in 1951.',
    'The bass is tuned like the four lowest strings of a guitar, just one octave lower.',
    'Standard guitar tuning is E A D G B E. Between the strings, the interval is a fourth in almost every case; only between G and B is it a third.',
    'Each fret raises the pitch by one semitone. Twelve frets later, the open string comes back, one octave higher.',
    'Frets get closer together as you go up the neck: the distance shrinks by about 6% with each fret.',
    'The central A (A4) vibrates at 440 Hz in the international standard. The app tuner uses that reference, adjustable from 430 to 450 Hz.',
    'The pentatonic scale, with only five notes, appears in an enormous number of blues and rock songs.',
    'Classical guitars use nylon strings, and steel-string acoustics use steel. The sound and the feel are very different.',
    'A barre chord presses several strings with one finger. The F major chord is the most famous example.',
    'The ukulele name is popularly translated from Hawaiian as "jumping flea". The exact origin is debated.',
    'Many memorable solos have more silence than notes. Letting a note breathe is part of the music too.',
    'ScaleMonster plays each note at the exact frequency of the string and fret. It is not an audio file: it is sound synthesis.',
    'Raising the tempo little by little is one of the most effective ways to learn a scale. Turn on automatic speed-up in the settings.',
    'How many guitarists does it take to change a string? Three: one changes it, two say the old one sounded better.',
    'How many bassists does it take to change a light bulb? One. The rest of the band is waiting for the chorus.',
    'The guitarist said to the bassist: "I play a lot of notes." The bassist replied: "I play the ones that matter."',
    'A guitarist without a tuner is like a cook who never tastes the food: sooner or later someone complains.',
    'The bass is the instrument people feel before they hear it. That is why bassists always arrive on time.',
    'A metronome never complains, but it never agrees with you either. You can learn a lot from that honesty.',
    'The drummer asked the bassist: "Are you ahead?" He replied: "No, the clock is behind."',
    'A blues guitarist with only five notes in the pocket can still make the whole crowd feel the solo.',
    'A scale is just a map. The music happens when you decide where to go on it.',
  ],
};

/** Escolhe uma curiosidade no idioma (inglês para os demais idiomas). `rand` existe para testes. */
export function pickCuriosidade(lang: string, rand: () => number = Math.random): string {
  const list = lang === 'pt' ? CURIOSIDADES.pt : CURIOSIDADES.en;
  const i = Math.min(list.length - 1, Math.floor(rand() * list.length));
  return list[i];
}
