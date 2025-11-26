# Developmental Log

## Issue: Github Authentication Failure
**Date:** Nov 22, 2025
**Time:** 6:16PM
**Problem:** Couldn't git push using password
**Solution:** Reddit lists setting up SSH keys for secure authentication through Ubuntu Terminal.

## Issue: Operation Not supported!
**Date:** Nov 22, 2025
**Time:** 8:03PM 
**Problem:** Ran a test simply testing the authentication features, yet VM couldn't open without a GUI
**Solution:** Grab the link it provided, paste onto my home machine, and then it'll redirect me completing the test. 
**What I learned:** 
- Spotipy automatically runs a local server on port 8888 to catch the callback
- Spotify hates when I use localhost so for a redirect link always use the numerical version (127.0.0.1)
- VM and Host Machine can communicate through network ports even without a GUI  

## Issue: Raw json data was unformatted
**Date:** Nov 23, 2025
**Time:** 11:29PM
**Problem:** Took the data from spotify, ideally getting my recently played songs through the "user-read-recently-played" scope on spotify's documentation. This was succcessful, however it was formatted incorrectly!
**Solution:** Imported JSON and used "json.dumps()" to convert the dictionary to a formatted string, using "indent=2" to properly indent the formatted string.
**What I'll be doing next:** What it does is nice, however it gives me all the information. That's not what I need for this. Going to replace the print function with a for loop likely that loops through each item, and then extracts the data that I want and prints it into a clean format. 

## Close Call: Basic loop avoided
**Date:** Nov 23, 2025
**Time:** 11:46PM
**Problem:** Brainstorming on how to implement the formatting for this JSON data, I nearly wrote and implemented a basic loop that would've left out plenty edge cases- mainly errroring out if the song had more than one artist! Not ideal for development nor LLM training. 
**Solution:** Using modules like datetime to fix the ugly time formatting and incorporating a way to get all the artists first and THEN join them together. 

## Goal Reached
**Date:** Nov 24, 2025
**Time:** 12:08AM
**Accomplishments:** 
- Successfully pulled listening history from Spotify's API
- Implemented an improved loop before committing it, saving myself the headache (See '## Close Call') 
- Handled multiple artists issue with list comprehension and .join()
- Converted ugly ISO timestamps that Spotify gives out and converted it to a readable human format using a python module in datetime
- Finally got proof of concept after a day of working and reading documentation! 
 

## Demotivation
**Date:** Nov 24, 2025
**Time:** 5:55PM
**Problem:** I got my proof of concept, it was a proud moment and I was extremely excited to continue this morning at 11:30am after finishing my morning routine. The reality was I was extremely demotivated.
**Solution:** I stood up and moved my life around so I won't have to code when I'm not feeling it. I'm writing this as a reminder to look back on that I do not have to code when I don't feel like it, quality > quantity. 

## Spotify Audio Features Blocked 
**Date:** Nov 24, 2025
**Time:** 9:32PM
**Problem:** 
- Spent an hour and a half debugging authentication thinking it was a token issue 
- Print checked and discovered I had a valid token all along (verified with sp.track() which worked) 
- both "sp.audio_features()" and "sp.audio_analysis" returned 403 even with a verifiably valid auth
- Apparently personal spotify apps in dev mode are restricted from those endpoints, even tried to verify with creating a different test app to see if I was running out of requests, nope. 
- No way around it, only orgs can request quota extensions
**The Pivot:** Choosing to switch to Lastfm API an alternative data source, and it's look bright so far. 
**What I learned:** Although the wall was two hours long, last fm's tags will likely be better for machine learning so overall a win.  

## The absolute most progress i've made in 6 hours after physical therapy
**Date:** Nov 25-26, 2025
**Time:** 5:45PM Nov 25, - 2:09AM Nov 26 
**Problem:** Needed to expand on the lastfm API and continuous history tracker to enable personalized recommendations and then ultimately ML training. 
**What I built:** 
1. **Taste Profile System (build_test_profile.py)**
- pulls recent Spotify listening history (the max that Spotify allows at a time which is 50 tracks)
- extracts the unique artists using set() for efficiency
- gets last.fm tags for each artist named
- calculates the composite scores for each using sqrt which is avg_weight x sqrt(the amount of unique artists)
- balances niche interests through said sqrt method so their average doesn't rank them higher simply because it's weight is being multiplied by 1
- saves timestamped JSON profiles for tracking taste evolution and to not overlap!
2. **SQLITE Database Schema (setup_database.py)**
- primary function is to not only save the data i've provided. 
3. **Incremental Sync System (sync_listening_history.py)** 
- uses Spotify's 'after' parameter for incremental pulls
- only gets plays since the last time it's saved to sync
- logs new plays and specifically skips duplicate plays (although given the timeframe is like a milisecond this won't be used a lot)
4. **Automated Cron Jobs**
- used cron to automate the collection data, runs 3x daily! 8am, 2pm, 10pm. 
- captures my ~77 songs/day without missing anything
- logs to sync.log for monitoring!

**What I learned:**
- What didn't I learn. I really liked the further experience in using sets, given I did have multiple w3schools tabs open. Figuring out which scoring i wanted to use in order to balance my taste in music, I'm really appreciating just how unique i'm able to make this code since it's just for me. 
- Cron was super easy to learn, really cool that it can do that. 
- PRIMARY KEY constraints handling duplicates at the database level- all of SQLlite is a fever dream thank you to that one Coursea Course I took and furthermore thank you to claude for helping further explain that coursea was teaching me, so I could not only intake the information that coursea was feeding me and write it down using a physical notebook, but then have claude explain it until i understood it. Really good way to learn and it's why I was able to do a lot of this in the timeframe I've done it, given it still has taken me days and hours of documentation. 

**Next Steps:** 
- I requested my entire Spotify data dump- ideally I will be importing that data for a more robust training. 
- Actually building the recommendation engine (dreadful) 
- continue to collect data! 

