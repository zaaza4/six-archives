/*
  SIX ARCHIVES — editable data
  ----------------------------------------------------------------
  THE SOUNDTRACK
  Add a song or playlist by copying one object below and pasting it into the array.

    id       short archive label, e.g. 'S-04'
    side     'A' or 'B' (cassette side label)
    title    song / playlist name (shown handwritten on the cassette)
    artist   artist or "playlist" line
    spotify  paste ANY normal Spotify share link: a track, album, playlist or episode,
             e.g. 'https://open.spotify.com/track/xxxxxxxxxxxxxxxxxxxxxx'
             Leave it '' to show an empty "tape not inserted yet" slot.
    memory   (optional) the exact title of one memory card, to connect song and memory
    note     why this song belongs to that memory
    scribble (optional) a tiny handwritten margin note
    color    (optional) cassette colour: 'rust' | 'sage' | 'brown'
*/
window.SIX_ARCHIVES = {
  soundtrack: [
    {
      id: 'S-01',
      side: 'A',
      title: 'The song of the classroom days',
      artist: 'Add the artist here',
      spotify: '',
      memory: 'The usual classroom',
      note: 'Write a line or two about why this song belongs to this memory. Paste a Spotify link above and the player appears right here.',
      scribble: 'on repeat, always',
      color: 'rust'
    },
    {
      id: 'S-02',
      side: 'A',
      title: 'The one we all knew the words to',
      artist: 'Add the artist here',
      spotify: '',
      memory: 'People who made it better',
      note: 'A song for the people. Playlists work too: a whole album or a shared school playlist can sit on this shelf.',
      scribble: 'sing louder',
      color: 'sage'
    },
    {
      id: 'S-03',
      side: 'B',
      title: 'Almost the last page',
      artist: 'Add the artist here',
      spotify: '',
      memory: 'Almost the last page',
      note: 'The song that plays when it all starts to feel like an ending, and a beginning.',
      scribble: 'side B, the quiet side',
      color: 'brown'
    }
  ]
};
