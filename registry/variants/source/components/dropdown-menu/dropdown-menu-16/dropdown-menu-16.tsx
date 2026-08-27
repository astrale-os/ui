'use client'

import { useState } from 'react'

import { Button } from '@astrale-os/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@astrale-os/ui/dropdown-menu'
import { Switch } from '@astrale-os/ui/switch'

const DropdownMenuSlideUpAnimationDemo = () => {
  const [googleSwitch, setGoogleSwitch] = useState(false)
  const [twitterSwitch, setTwitterSwitch] = useState(false)
  const [linkedinSwitch, setLinkedinSwitch] = useState(false)
  const [dribbbleSwitch, setDribbbleSwitch] = useState(false)
  const [behanceSwitch, setBehanceSwitch] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline'>Slide Up Animation</Button>} />
      <DropdownMenuContent
        align='center'
        className='data-open:slide-in-from-left-0 data-open:data-[side=bottom]:slide-in-from-bottom-20 data-open:data-[side=top]:slide-in-from-bottom-20 data-closed:slide-out-to-bottom-20 data-closed:slide-out-to-left-0 data-closed:zoom-out-100 w-56 duration-400'
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Apps notification</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className='justify-between' closeOnClick={false}>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/dropdown/google.png'
              alt='google'
              className='size-4'
            ></img>
            <span className='flex-1'>Google</span>
            <Switch id='airplane-mode' checked={googleSwitch} onCheckedChange={setGoogleSwitch} />
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between' closeOnClick={false}>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/dropdown/twitter.png'
              alt='twitter'
              className='size-4'
            ></img>
            <span className='flex-1'>Twitter</span>
            <Switch id='airplane-mode' checked={twitterSwitch} onCheckedChange={setTwitterSwitch} />
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between' closeOnClick={false}>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/dropdown/linkedin.png'
              alt='linkedin'
              className='size-4'
            ></img>
            <span className='flex-1'>Linkedin</span>
            <Switch id='airplane-mode' checked={linkedinSwitch} onCheckedChange={setLinkedinSwitch} />
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between' closeOnClick={false}>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/dropdown/dribbble.png'
              alt='dribbble'
              className='size-4'
            ></img>
            <span className='flex-1'>Dribbble</span>
            <Switch id='airplane-mode' checked={dribbbleSwitch} onCheckedChange={setDribbbleSwitch} />
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between' closeOnClick={false}>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/dropdown/behance.png'
              alt='behance'
              className='size-4'
            ></img>
            <span className='flex-1'>Behance</span>
            <Switch id='airplane-mode' checked={behanceSwitch} onCheckedChange={setBehanceSwitch} />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuSlideUpAnimationDemo
