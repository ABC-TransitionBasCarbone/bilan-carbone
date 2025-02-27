import { Post } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import Posts from './Posts'

interface Props<T extends EmissionFactorCommand> {
  post?: Post
  form: UseFormReturn<T>
}

const MultiplePosts = <T extends EmissionFactorCommand>({ form, post: initalPost }: Props<T>) => {
  const [posts, setPosts] = useState<{ id: number; post?: Post }[]>(initalPost ? [{ id: 0, post: initalPost }] : [])

  const addPost = () => {
    setPosts([...posts, { id: posts.length + 1 }])
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
      <button onClick={addPost}>Add Post</button>
      {posts.map((postObj) => (
        <div key={postObj.id}>
          <Posts form={form} post={postObj.post} />
        </div>
      ))}
    </div>
  )
}

export default MultiplePosts
