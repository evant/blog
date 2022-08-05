---
title: "The Mess that is Android Biometrics"
date: 2019-10-01
---

Oh FingerprintManager is deprecated? It’s replaced with this new thing
BiometricPrompt that comes with it’s own UI and supports a wider range of
biometrics? There’s even an [androidx
library](https://developer.android.com/jetpack/androidx/releases/biometric)
that does the compatibility work for you? This will be easy! HAHAHAHHAHHAHA

This is the story of all the pain I’ve run into with implementing
BiometricPrompt so you don’t have to.

If you just want a recommendation for today, it would be: Use
FingerprintManager on Android 9, use BiometricPrompt on Android 10, throw in a
few hacks for a better user experience, and cross your fingers and hope for the
best.

## The beginning

It all started back in 2018, fresh off the google I/O hype train. I decided to
look into this new BiometricPrompt thing. It looked easy to implement and came
with an androidx lib in alpha that seemed to work alright. So I went ahead and
implemented a rough POC in my project, demoed to our product owner on a Pixel 1
and everything looked great. “That was easy”, I thought. Little did I know what
was to come.

## The cracks start to show

Done with the happy path, I went on to implement the error handling. Making
sure all was well, I made sure to test on both the BiometricPrompt and
FingerprintManager paths. Unfortunately, I noticed some major differences on
how things were handled such as cases where the user was locked out because of
too many fingerprint attempts. Before Android 9 it would show the dialog with
the error, but on Android 9 it would show nothing. “No worries”, I thought. The
lib was in alpha. I filled a bug and put in a work-around.

With BiometricPrompt I also noticed that there could be several seconds between
when asking to show the dialog and when it actually showed or an error was
returned. I worked around this by adding in a loading indicator in the ui. But
when to stop showing it? There’s no callback when the BiometricPrompt is
actually shown and no lifecycle events are fired. Eventually, I found out that
the window loses focus when the prompt is shown. So with one
`OnWindowFocusChangeListener` later I got that fixed.

Given that biometrics is an optional feature for our users, naturally we’d want
a way to detect that they have it enabled. Well apparently nobody at Google
thought of that as they went ahead and deprecated
`FingerprintManager.hasEnrolledFingerprints()` without providing a replacement.
But no phone out there _actually_ uses any other authentication besides
fingerprint right? So went ahead using that deprecated method (stay tuned).

Everything seemed fine until I got a bug from QA. Sometimes the prompt wasn’t
showing, only on Android 9 of course. I was confused, we show it in `onResume()`,
no complicated logic there. Well it turns out that’s not good enough for
BiometricPrompt. From what I can only assume was to prevent from showing when
the app is in the background, if your window doesn’t have focus, the call will
simply be ignored. Furthermore, in the `onResume()` callback, your window will
only sometimes have focus because having a consistent callback ordering in
android would be boring. Solution: another OnWindowFocusChangeListener then.
_Sigh_.

The implementation wasn’t as pretty now, but hey nothing that couldn’t be
worked-around. Everything looked good and we shipped with our shiny new
biometric prompt.

## Enter our good friend (take one guess, spoiler it’s Samsung)

Not too long after we shipped, Samsung finally got around to updating their
phones to Android 9. Now if you weren’t aware (I wasn’t) these phones had this
nifty ‘feature’ where you could unlock your phone with your face or iris. Now
you may be thinking, “hey this doesn’t sound all that secure.” Well guess what?
[It](https://www.forbes.com/sites/amitchowdhry/2017/03/31/samsung-acknowledges-galaxy-s8-facial-recognition-security-limitations/#32d9d0ed1aff)
[isn’t!](https://arstechnica.com/information-technology/2017/05/breaking-the-iris-scanner-locking-samsungs-galaxy-s8-is-laughably-easy/)
That would be ok if it was only contained as an OS feature and didn’t affect
app api’s, but this is Samsung we’re talking about. Mucking with api’s is their
expertise. In their infinite wisdom they decided to update the stock biometric
prompt work with face/iris. So now we have two wonderful issues:

1. `FingerprintManager.hasEnrolledFingerprints()` might not be right anymore. If
   the user has face/iris enrolled but no fingerprints, it’ll return false. If
   they have both it’ll return true, but show the face/iris unlock for the
   dialog. And of course we don’t have any other api to use instead.
2. Now this one is a [doozy](https://issuetracker.google.com/issues/123997468).
   You know how I mentioned that these methods weren’t secure? Well the system
   correctly realizes this and refuses to decrypt the key for you when using
   face. So you prompt the user to authenticate with biometrics, they
   authenticate with their face, and boom! You get a SignatureException. Of
   course there’s no way to know which biometrics the user has enabled, so you
   are screwed.

Well the bad user reviews were coming in and we needed to figure out how to fix
this quick. There’s no easy workaround we can add this time. So we did the next
best thing: copy all of androidx biometric into our app and hard-code it to use
the stock FingerprintManager implementation. And that’s where things stand
today.

## A hope for the future?

So here we are, using a compat lib but not really. We could’ve stuck with
FingerprintManager and ignored all of this mess. However, Android 10 did just
came out, and there’s been some improvements in the androidx lib, maybe there’s
hope?

For one Android 10 did finally add a replacement to
`FingerprintManager.hasEnrolledFingerprints()` in the form of
`BiometricManager.canAuthenticate()`. Unfortunately that won’t help us on Android 9.
They also tightened the CTS (compatibly test suite) around this so with any
luck the Samsung issues will get fixed when they update to 10. Finally, they
seem to be [receptive](https://issuetracker.google.com/issues/129937212) to add
some sort of work-around for the Samsung issue in the androidx lib. And with
the Pixel 4 around the corner which is rumored on only have face unlock, this
is good. As it stands today, we aren’t quite at the place we can drop something
in and call it a day, but we are a bit closer.