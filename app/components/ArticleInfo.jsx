import React from 'react';
import UserTag from '@/app/components/UserTag';

function ArticleInfo({ articleDetails }) {
  const user = {
    name: articleDetails?.userName, 
    email: articleDetails?.userEmail, 
    image: articleDetails?.userImage 
  };

  return (
    <div>
      <h2 className='text-[30px] font-bold mb-10'>{articleDetails?.title}</h2> 
      <UserTag user={user} />
 
      
      <h2 className='mt-10'>{articleDetails?.desc}</h2>
    </div>
  );
}

export default ArticleInfo;
