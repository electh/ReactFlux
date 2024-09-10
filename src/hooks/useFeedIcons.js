import { useStore } from "@nanostores/react";
import { map } from "nanostores";
import { useEffect } from "react";
import { getFeedIcon } from "../apis";

const feedIconsState = map();
const loadingIcons = new Set();

const useFeedIcons = (id) => {
  const feedIcons = useStore(feedIconsState);

  useEffect(() => {
    if (feedIcons[id] || loadingIcons.has(id)) {
      return;
    }

    loadingIcons.add(id);

    getFeedIcon(id)
      .then((data) => {
        const iconURL = `data:${data.data}`;
        feedIconsState.setKey(id, iconURL);
        loadingIcons.delete(id);
      })
      .catch(() => {
        loadingIcons.delete(id);
      });
  }, [id, feedIcons]);

  return feedIcons[id];
};

export default useFeedIcons;
