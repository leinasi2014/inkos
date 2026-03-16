export function buildBookThreadId(bookId: string, kind: "write" | "materials") {
  return `thread_${bookId}_${kind}`;
}

export function getBookOverviewHref(bookId: string) {
  return `/books/${bookId}`;
}

export function getBookChapterHref(bookId: string, chapterNumber: number) {
  return `/books/${bookId}/chapters/${chapterNumber}`;
}

export function getBookTruthHref(bookId: string) {
  return `/books/${bookId}/truth`;
}

export function getBookMaterialsHref(bookId: string) {
  return `/books/${bookId}/materials`;
}

export function getChiefHref(threadId?: string) {
  return threadId ? `/chief?threadId=${threadId}` : "/chief";
}
