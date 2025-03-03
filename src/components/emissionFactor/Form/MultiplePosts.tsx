import { Post, PostObject } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import Posts from './Posts'

interface Props<T extends EmissionFactorCommand> {
  post?: PostObject
  form: UseFormReturn<T>
}

const MultiplePosts = <T extends EmissionFactorCommand>({ form }: Props<T>) => {
  const [posts, setPosts] = useState<PostObject>({})


  useEffect(() => {
   const postObj = (form.getValues("subPosts") as PostObject) || {}
    console.log("tmpPosts",  Object.keys(postObj));
    setPosts(postObj)
  }, [])

  const addPost = () => {
    setPosts({...posts, "" : []})
  }

  // const handleChange = (id :number, event) => {
  //     const newPosts = posts.map(post => {
  //         if (post.id === id) {
  //             return { ...post, content: event.target.value };
  //         }
  //         return post;
  //     });
  //     setPosts(newPosts);
  // };

  return (
    <div>
      <button type="button" onClick={addPost}>
        Add Post
      </button>
      {Object.keys(posts).map((postKey) => (
        <div key={postKey}>
          <Posts form={form} subPosts={posts[postKey as Post]} />
        </div>
      ))}
    </div>
  )
}

export default MultiplePosts
