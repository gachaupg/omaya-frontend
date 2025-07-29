// https://www.sanity.io/docs/structure-builder-cheat-sheet
// structure.ts
export const structure = (S: any) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Rejection Templates')
        .child(
          S.documentList()
            .title('Rejection Templates')
            .filter('_type == "rejectionTemplate"')
            .child((documentId: string) => 
              S.document()
                .documentId(documentId)
                .schemaType('rejectionTemplate')
            )
        ),
      S.divider(),
      ...S.documentTypeListItems()
    ])