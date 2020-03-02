# You Don't Need to Null Out Views

There's been a long standing footgun when using fragments on android because
it's views can be recreated out from under it. Solutions to this have ranged
from ignoring the problem to some complicated rxjava setup. However, with the
additions to androidx this is no longer necessary!

The trick is to scope all view interactions to `onViewCreated()`. 

```kotlin
class MyFragment : Fragment(R.layout.my_fragment) {
  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    val binding = MyBinding.bind(view)
    binding.text = "Look, no leaks!"
  }
}
```

If you don't assign any views to fragment fields, you don't need to worry about
clearing them out.

Sidenote: if you are not familiar with some of the features here, check out the
[new fragment
constructor](https://developer.android.com/reference/androidx/fragment/app/Fragment#Fragment(int))
and [view binding](https://developer.android.com/topic/libraries/view-binding).

Now, you may be wondering how you are supposed to accomplish much with this
limited scope, but with a few other androidx features it turns out to be quite
a bit.


## Listening for updates

The other key part to this is
[viewLifecycleOwner](https://developer.android.com/reference/androidx/fragment/app/Fragment#getViewLifecycleOwner()).
This gives you a scope that you can use for asynchronous operations. For
example, you can listen to liveData:

```kotlin
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
  val binding = MyBinding.bind(view)
  viewModel.title.observe(viewLifecycleOwner) { text -> binding.text = text }
}
```

Or scope a
coroutine/[Flow](https://kotlinlang.org/docs/reference/coroutines/flow.html)
operation:

```kotlin
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
  val binding = MyBinding.bind(view)
  viewLifecycleOwner.lifecycle.coroutineScope.launchWhenStarted {
    viewModel.title.collect { text -> binding.text = text } 
  }
}
```

## Lifecycle Events

If you need to handle view-related things in other lifecycle events like
`onPause/onResume`, you can attach your own `LifecycleObserver`.

```kotlin
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
  val binding = MyBinding.bind(view)
  viewLifecycleOwner.lifecycle.addObserver(object: DefaultLifecycleObserver {
    override fun onResume(owner: LifecycleOwner) {
      Snackbar.make(view, "OnResume Called", Snackbar.LENGTH_LONG).show()
    }
  })
}
```

## Other Callbacks

The one place where this gets more tricky is if you need to handle other
callbacks that haven't yet been broken out by androidx. For example, runtime
permissions. In these cases, I would recommend routing the event in a way you
can react to it.

For example, you could use an [event
wrapper](https://medium.com/androiddevelopers/livedata-with-snackbar-navigation-and-other-events-the-singleliveevent-case-ac2622673150#0e87)
with live data:

```kotlin
private val showCamera = MutableLiveData<Event<Boolean>>()

override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
  val binding = MyBinding.bind(view)

  showCamera.observe(viewLivecycleOwner) { event ->
    event.getContentIfNotHandled()?.let { permission ->
      if (permission) {
        startActivity(Intent(requireContext(), CameraActivity::class.java)
      }
    }
  }

  binding.showCameraButton.setOnClickListener {
    if (ContextCompat.checkSelfPermission(
        requireContext(), 
        Manifest.permission.CAMERA == PackageManager.PERMISSION_GRANTED
    ) {
      showCamera.value = Event(true)
    } else {
      requestPermissions(arrayOf(Manifest.permission.CAMERA), 0)
    }
  }
}

override fun onRequestPermissionsResult(
  requestCode: Int,
  permissions: Array<out String>,
  grantResults: IntArray
) {
  if (requestCode == 0 && grantResults.size == 1) {
    showCamera.value = Event(grantResults[0] == PackageManager.PERMISSION_GRANTED)
  }
}
```

Or use a [Channel](https://kotlinlang.org/docs/reference/coroutines/channels.html):
```kotlin
private val showCamera = Channel<Boolean>(1)

override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
  val binding = MyBinding.bind(view)

  viewLifecycleOwner.lifecycle.coroutineScope.launchWhenStarted {
    for (permission in showCamera) {
      if (permission) {
        startActivity(Intent(requireContext(), CameraActivity::class.java)
      }
    }
  }

  binding.cameraButton.setOnClickListener {
    if (ContextCompat.checkSelfPermission(
        requireContext(), 
        Manifest.permission.CAMERA == PackageManager.PERMISSION_GRANTED
    ) {
      showCamera.offer(true)
    } else {
      requestPermissions(arrayOf(Manifest.permission.CAMERA), 0)
    }
  }
}

override fun onRequestPermissionsResult(
  requestCode: Int,
  permissions: Array<out String>,
  grantResults: IntArray
) {
  if (requestCode == 0 && grantResults.size == 1) {
    showCamera.offer(grantResults[0] == PackageManager.PERMISSION_GRANTED)
  }
}
```

By scoping your views to `onViewCreated` you don't have to worry about nulling
them out our calling them at the wrong time. And androidx gives you the tools
to do it!
