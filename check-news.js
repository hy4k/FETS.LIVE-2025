import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ No Supabase key found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNews() {
  console.log('🔍 Checking news_updates table...\n')

  // Fetch all news items
  const { data: allNews, error: allError } = await supabase
    .from('news_updates')
    .select('*')
    .order('created_at', { ascending: false })

  if (allError) {
    console.error('❌ Error fetching news:', allError)
    return
  }

  console.log(`📊 Total news items in database: ${allNews?.length || 0}\n`)

  if (allNews && allNews.length > 0) {
    console.log('📰 News items:')
    allNews.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.content.substring(0, 50)}...`)
      console.log(`   ID: ${item.id}`)
      console.log(`   Branch: ${item.branch_location}`)
      console.log(`   Priority: ${item.priority}`)
      console.log(`   Active: ${item.is_active ? '✅' : '❌'}`)
      console.log(`   Expires: ${item.expires_at || 'Never'}`)
      console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`)
    })
  } else {
    console.log('⚠️  No news items found. Creating a test news item...\n')

    const testNews = {
      content: 'Welcome to FETS.LIVE! This is a test news item to verify the news ticker is working.',
      priority: 'normal',
      branch_location: 'global',
      is_active: true,
      expires_at: null
    }

    const { data: newItem, error: insertError } = await supabase
      .from('news_updates')
      .insert(testNews)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating test news:', insertError)
    } else {
      console.log('✅ Test news item created successfully!')
      console.log('📰 New item:', newItem)
    }
  }

  // Check active news
  const now = new Date().toISOString()
  const { data: activeNews, error: activeError } = await supabase
    .from('news_updates')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (!activeError) {
    console.log(`\n✅ Active news items (not expired): ${activeNews?.length || 0}`)
  }
}

checkNews()
