import { Message, Modal } from "@arco-design/web-react";
import { removeFeed } from "../../api/api";
import { useStore } from "../../store/Store";
import { useModalStore } from "../../store/modalStore";
import { IconExclamationCircleFill } from "@arco-design/web-react/icon";

export default function DeleteFeedModal({ feed }) {
  const initData = useStore((state) => state.initData);
  const modalLoading = useModalStore((state) => state.modalLoading);
  const deleteFeedVisible = useModalStore((state) => state.deleteFeedVisible);
  const setDeleteFeedVisible = useModalStore(
    (state) => state.setDeleteFeedVisible,
  );

  const handelDeleteFeed = async (feed) => {
    try {
      const response = await removeFeed(feed.id);
      if (response) {
        Message.success("Success");
        setDeleteFeedVisible(false);
        await initData();
      }
    } catch (error) {
      console.error("Error deleting feed:", error);
    }
  };

  return (
    <Modal
      title={
        <span>
          <IconExclamationCircleFill />
          Unsubscribe
        </span>
      }
      visible={deleteFeedVisible}
      style={{ width: "400px", maxWidth: "calc(100% - 20px)" }}
      simple={true}
      confirmLoading={modalLoading}
      onOk={() => handelDeleteFeed(feed)}
      onCancel={() => setDeleteFeedVisible(false)}
      okButtonProps={{ status: "danger" }}
      autoFocus={false}
      focusLock={true}
    >
      <div
        style={{ display: "flex", justifyContent: "center" }}
      >{`Unsubscribe from ${feed?.title}`}</div>
    </Modal>
  );
}
