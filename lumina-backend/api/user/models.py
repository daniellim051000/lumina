from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile to store additional user preferences"""

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("zh-hans", "Simplified Chinese"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    language_preference = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en",
        help_text="Preferred language for the interface",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username}'s profile"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a profile when a new user is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the profile when the user is saved"""
    if hasattr(instance, "profile"):
        instance.profile.save()
