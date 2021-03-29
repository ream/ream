const HN_API = `https://hacker-news.firebaseio.com/v0`

export type Item = {
  id: number
  title: string
  url: string
  by: string
  time: number
  descendants: number
  score: number
  kids: number[]
  text?: string
}

export const loadItem = async (id: number): Promise<Item> => {
  const item = await fetch(`${HN_API}/item/${id}.json`).then((res) =>
    res.json()
  )
  return item
}

export const loadTopStoryIds = async () => {
  const ids: number[] = await fetch(`${HN_API}/topstories.json`).then((res) =>
    res.json()
  )

  return ids
}
