---
title: "Some More Biometric Messes"
date: 2020-01-29
---

This is a follow-up to [The Mess that is Android
Biometrics](https://evan.tatarka.me/2019/10/01/the-mess-that-is-android-biometrics.html),
as we found even more wonderful surprises.

So the [androidx biometric compat
lib](https://developer.android.com/jetpack/androidx/releases/biometric?hl=en#1.0.1)
is out and stable. And it
([mostly](https://issuetracker.google.com/issues/142150327#comment26))
blacklists Samsung devices so they are forced to use fingerprint. We can plop
it in and all our woes are gone right? _Sigh_, I guess you can see where this
is going. I wouldn't be writing another blog post otherwise.

When the user enables biometrics in our app, we show the biometrics prompt.
While is not strictly necessary, it is a nice assurance to the user that it's
working correctly. Well it turns out that while the blacklist solved the
Samsung issue on login, it did _not_ solve it for this prompt. This lead to an
interesting concept about android's biometrics implementation that's not really
called out anywhere in the documentation.

## Wait, not all biometrics are supposed to be secure?

Android actually supports _two_ forms of biometrics: secure and insecure.
Secure biometrics pass a certain level of [security
requirements](https://source.android.com/security/biometric/measure) which
allows them to unlock encryption keys. Insecure biometrics... do not. What's
the point in prompting for insecure biometrics that can't be used for
encryption? Who knows? I guess security theater could be important to somebody.
Well when we were showing the prompt to enable biometrics we were not passing
in a cipher as we didn't need one. Unfortunately, this means that insecure
biometrics are allowed and so it doesn't use the blacklist. So lesson learned:
_always_ pass in the cipher when showing the prompt to get a consistent
experience.

## Did anyone know this?

It seems like even the people who created the biometircs api didn't realize
this. We got `BiometricManager.canAuthenticate()` in api 29, but this method
does not distinguish between secure and insecure biometrics. So if you are
using biometrics for it's intended purpose, it's useless. Luckily, there is
another way. If you try to set up a key when the user has no secure biometrics
enrolled it'll throw an exception.

```kotlin
fun canSecurelyAuthenticate(): Boolean {
    try {
        val keystore = KeyStore.getInstance("AndroidKeyStore")
        KeyGenerator.getInstance("AES", keystore.provider)
    	    .init(
    		    KeyGenParameterSpec.Builder("DUMMY_KEY_ALIAS", KeyProperties.PURPOSE_DECRYPT)
    			    .setUserAuthenticationRequired(true)
    			    .build()
    	    )
        return true
    } catch (e: InvalidAlgorithmParameterException) {
        // expected error if user isn't enrolled in secure biometrics
        return false
    } catch (e: Exception) {
        // Log unexpected errors, though if there's an issue with the keystore we probably can't use
        // biometrics anyway.
        Log.w("keystore error", e)
        return false
    }
}
```

## What now?

A feature request has been
[filed](https://issuetracker.google.com/issues/147423828) for having a secure
form of `BiometricMnager.canAuthenticate()`. It appears that the necessary api
will be available in Android 11 and hopefully there will be some androidx
workaround. In the meantime, I've been maintaining a [sample
repo](https://github.com/evant/android-biometrics-compat-issue) that collects
all the workarounds necessary for getting biometrics to work correctly.