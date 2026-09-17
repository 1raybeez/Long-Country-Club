import { loadArchiveCoverage } from "@/lib/history/archiveStats";
import ArchivesClient from "./ArchivesClient";

export default function ArchivesPage() {
  return <ArchivesClient archive={loadArchiveCoverage()} />;
}
