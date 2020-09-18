# Introducing kotlin-inject

[kotlin-inject](https://github.com/evant/kotlin-inject) is a compile-time
dependency injection library for kotlin.

## What is dependency injection?

The concept of dependency injection is actually quite simple. Instead of
declaring your dependencies inside an object, provide them from the outside. So
instead of

```kotlin
class Api {
  private val httpClient = HttpClinet()
  private val jsonParser = JsonParser()

  ...
}
```

you have

```kotlin
class Api(private val httpClient: HttpClient, private val jsonParser: JsonParser) {
  ...
}
```

This gives you some nice properties. For example, you now have a nice list of
all of your dependencies for a class right there in the constructor. Too many
can be a sign that the class might be doing to much. It also makes them easier
to swap out, you can simply pass a different implementation to the constructor.
This aids testing and refactoring.

It does introduce a problem though, object construction can get quite involved.
Instead of doing:

```kotlin
val api = Api()
```

you now have to do

```
val api = Api(HttpClient(), JsonParser())
```

These constructions can get quite large as you build of a tree of your
dependencies. It also means that if you add a new argument, you now have to
thread it through all the places that it's used.

A dependency injection library solves this by writing this code for you.

## How kotlin-inject works

With kotlin-inject you create a component, which is an abstract class which
describes what objects you want to construct and how to obtain it's
dependencies. It will then generate an implementation for you which constructs
said objects.

```kotlin
@Component abstract class AppComponent {
  abstract val api: Api
}

val appComponent = AppComponent::class.create()
val api = appComponent.api
```

## What sets kotlin-inject apart?

If you know about [dagger](https://dagger.dev/) then all this may look
familiar. So why create a new library if dagger already exists? I feel like
there's enough different here to be worth a new library.

### Kotlin-first

This means that unlike dagger, kotlin-inject has first-class support for kotlin
features like typealias. It also has a
[ksp](https://github.com/android/kotlin/tree/ksp/libraries/tools/kotlin-symbol-processing-api)
backend to not require going through kapt, and to hopefully support
multiplatform in the future. 

### Ergonomics is preferred over runtime performance.

If you've used dagger, you'll notice it has a lot of annotations. A big reason
for this is to eke out every last drop of runtime performance in the generated
code.

While kotlin-inject does have some focus on runtime performance, it's not 'at
all cost'. If something can be accomplished by language features instead of an
annotation that is preferred. The goal here is for the generated code to be
closer to what you might write yourself.

### A bit more opinionated

kotlin-inject is a bit more opinionated in how you should use it. For example,
field injection is not supported. The issue with field injection is it can
leave your object in a weird state where it's constructed but not all it's
dependencies are met. This also causes issues with kotlin's type system (you
need a lot of lateinit).

### A look toward the future of Android

While kotlin-inject is a general-purpose library, it has been built with
Android in mind. However, it doesn't have anything like hilt or ViewModel
support. This is because I'm interested to see how jetpack compose changes and
simplifies architectures. A feature I'm excited about in this regard is being
able to inject into top-level functions.

```kotlin
typealias App = @Composeable () -> Unit

@Composeable @Inject fun App(repo: Repo) {
  val data by repo.data().observeAsState()

  ...
}

@Component class AppComponent {
  val app: App
}

setContent {
  AppComponent::class.create().app()
}
```

## Status

kotlin-inject is pre-1.0 at the moment. While I wouldn't yet use this in
production, it's a good opportunity to try out it out and report an bugs you
find, or give feedback on the api!
