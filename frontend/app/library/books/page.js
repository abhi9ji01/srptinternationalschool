"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function LibraryBooksPage() {
  return (
    <CrudPage
      title="Books"
      allow={["super_admin", "admin", "librarian"]}
      endpoint="/library/books"
      canEdit
      columns={[
        { key: "title", header: "Title" },
        { key: "author", header: "Author" },
        { key: "isbn", header: "ISBN" },
        { key: "category", header: "Category" },
        { key: "total_copies", header: "Total" },
        { key: "available_copies", header: "Available" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "author", label: "Author" },
        { name: "isbn", label: "ISBN" },
        { name: "publisher", label: "Publisher" },
        { name: "category", label: "Category" },
        { name: "total_copies", label: "Total Copies", type: "number" },
        { name: "location", label: "Location" },
        { name: "publication_year", label: "Publication Year", type: "number" },
        { name: "price", label: "Price", type: "number" },
      ]}
    />
  );
}
