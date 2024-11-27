import { Post } from "@/services/posts";
import { Box, LinearProgress } from "@mui/material";
import { Study, SubPost } from "@prisma/client";
import classNames from "classnames";
import styles from "./PostHeader.module.css";
import PostIcon from "./icons/PostIcon";
import { useTranslations } from "next-intl";

interface Props {
    study: Study
    post: Post | SubPost
    mainPost: Post | null
}

export const PostHeader = ({ study, post, mainPost }: Props) => {
    const t = useTranslations('emissionFactors.post')

    return (<div className={classNames(styles.header, 'align-center')}>
      <div className={classNames(styles.title)}>
        <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
        <span>{t(post)}</span>
      </div>
      <span>56 tCO2e</span>
  </div>)
};
