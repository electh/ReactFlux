import CreateFeedModal from "./components/CreateFeedModal";
import EditFeedModal from "./components/EditFeedModal";
import { useModalStore } from "../store/modalStore";
import DeleteFeedModal from "./components/DeleteFeedModal";
import EditCategoryModal from "./components/EditCategoryModal";

export default function Modals() {
  const activeFeed = useModalStore((state) => state.activeFeed);
  const activeCategory = useModalStore((state) => state.activeCategory);
  return (
    <div>
      <CreateFeedModal />
      <EditFeedModal feed={activeFeed} />
      <DeleteFeedModal feed={activeFeed} />
      <EditCategoryModal category={activeCategory} />
    </div>
  );
}
