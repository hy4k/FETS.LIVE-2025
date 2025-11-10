-- Check all news items
SELECT id, content, branch_location, priority, is_active, expires_at, created_at
FROM news_updates
ORDER BY created_at DESC;

-- Count total news
SELECT COUNT(*) as total_news FROM news_updates;

-- Count active news
SELECT COUNT(*) as active_news FROM news_updates WHERE is_active = true;

-- Count news by branch
SELECT branch_location, COUNT(*) as count
FROM news_updates
GROUP BY branch_location;
