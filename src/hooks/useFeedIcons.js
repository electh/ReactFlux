import { map } from "nanostores";
import useSWRImmutable from "swr";
import { getFeedIcon } from "../apis";
import { generateKey } from "../utils/swr";

const feedIconsState = map();
export const getCachedIconURL = (id) => feedIconsState.get()[id];
export const updateCachedIconURL = (id, iconURL) =>
  feedIconsState.setKey(id, iconURL);

export const useGetFeedIcon = (id) =>
  useSWRImmutable(generateKey("getFeedIcon", id), () => getFeedIcon(id));
