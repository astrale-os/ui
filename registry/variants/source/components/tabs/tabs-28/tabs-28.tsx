import { useState } from 'react'

import { motion, AnimatePresence } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@astrale-os/ui/tabs'
import { BookIcon, HeartIcon, GiftIcon } from "lucide-react"

const tabs = [
  {
    name: 'Explore',
    value: 'explore',
    icon: (
      <BookIcon
      />
    ),
    content: (
      <>
        Discover <span className='text-foreground font-semibold'>fresh ideas</span>, trending topics, and hidden gems
        curated just for you. Start exploring and let your curiosity lead the way!
      </>
    )
  },
  {
    name: 'Favorites',
    value: 'favorites',
    icon: (
      <HeartIcon
      />
    ),
    content: (
      <>
        All your <span className='text-foreground font-semibold'>favorites</span> are saved here. Revisit articles,
        collections, and moments you love, any time you want a little inspiration.
      </>
    )
  },
  {
    name: 'Surprise Me',
    value: 'surprise',
    icon: (
      <GiftIcon
      />
    ),
    content: (
      <>
        <span className='text-foreground font-semibold'>Surprise!</span> Here&apos;s something unexpected - a fun fact,
        a quirky tip, or a daily challenge. Come back for a new surprise every day!
      </>
    )
  }
]

const ExpandableTabsDemo = () => {
  const [activeTab, setActiveTab] = useState('explore')

  return (
    <div className='w-full max-w-md'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-4'>
        <TabsList className='gap-2 rounded-lg group-data-horizontal/tabs:h-fit'>
          {tabs.map(({ icon, name, value }) => {
            const isActive = activeTab === value

            return (
              <motion.div
                key={value}
                className='flex h-8 cursor-pointer items-center justify-center overflow-hidden rounded-md'
                onClick={() => setActiveTab(value)}
                initial={false}
                animate={{
                  width: isActive ? 120 : 32
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30
                }}
              >
                <TabsTrigger
                  nativeButton={false}
                  value={value}
                  render={
                    <motion.div
                      className='h-8 w-full justify-center *:[svg]:aspect-square *:[svg]:size-4 *:[svg]:shrink-0'
                      animate={{ filter: 'blur(0px)' }}
                      exit={{ filter: 'blur(2px)' }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      {icon}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.span
                            className='font-medium max-sm:hidden'
                            initial={{ opacity: 0, scaleX: 0.8 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            style={{ originX: 0 }}
                          >
                            {name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  }
                />
              </motion.div>
            )
          })}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className='text-muted-foreground text-sm'>{tab.content}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default ExpandableTabsDemo
