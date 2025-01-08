import Image from 'next/image'
import React from 'react'

function ArticleImage({articleDetails}) {

  return (
    <div>
      {articleDetails && 
        <Image 
          src={articleDetails?.image}
          alt={articleDetails?.title}
          width={1000}
          height={1000}
          onClick={articleDetails?.link ? () => window.open(articleDetails.link) : undefined} // Conditionally attach onClick
          className={`rounded-3xl ${articleDetails?.link ? 'cursor-pointer' : 'cursor-default'}`} // Conditionally set cursor
        />
      }
    </div>
  )
}

export default ArticleImage;
