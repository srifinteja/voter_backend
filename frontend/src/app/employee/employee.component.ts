import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../app.config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
interface Image {
  name: string;
  link: string;
  isTrue?: boolean; // Track if the "True" checkbox is checked
  isFalse?: boolean; // Track if the "False" checkbox is checked
}
// Update the interface to include employeeId
interface ImageSelection {
  employeeId: string;  // Added employeeId
  imageName: string;
  isTrue: boolean;
  isFalse: boolean;
  comment:string;
}

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [HttpClientModule,FormsModule,CommonModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit{
  employeeIds: string[] = [];
  currentEmployeeIndex: number = 0;
  
  employeeId: string = ''; // Replace with dynamic employee ID
  images: Image[] = [];
  currentIndex: number = 0;
  loading: boolean = false; 
  currentImagee: Image | null = null; // Current image to display
  comment: string = '';
  zoomLevel: number = 1; // Initialize zoom level
  modalOpen: boolean = false; // State to control modal visibility
  imageSelections: ImageSelection[] = []; 
  dragging: boolean = false; // Track dragging state
  startX: number = 0; // Starting X position
  startY: number = 0; // Starting Y position
  offsetX: number = 0; // X offset for dragging
  offsetY: number = 0; // Y offset for dragging
  // zoomLevel = 1;
  translateX = 0;
  translateY = 0;
  lastMouseX: number = 0;
  lastMouseY: number = 0;
  hasSelfImage :boolean = false;
  hasSpouseImage:boolean=false;
  isSubmitted: boolean = false;
  subfolders: string[] = [];
  selectedFolder: string = '';
  private submittedEmployeeIds: string[] = [];
  // zoomLevel: number = 1;
  rotation: number = 0;

  selfKyc = {
    isTrue: false,
    isFalse: false,
    noHit:false,
    comment: ''
  };
  
  spouseKyc = {
    isTrue: false,
    isFalse: false,
    noHit:false,
    comment: ''
  };
  
  // currentImage: { link: string } | null = null;  // Current image details
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.imageSelections = [];
    // this.loadEmployeeIds();
    this.fetchSubfolders();
    this.loadCsvData().subscribe((ids) => {
      this.submittedEmployeeIds = ids;
      // console.log('Submitted Employee IDs:', this.submittedEmployeeIds);
    });
  
  }
  onMouseMove(event: MouseEvent) {
    this.lastMouseX = event.offsetX; // Get mouse position relative to the image
    this.lastMouseY = event.offsetY;
  }
  // Method to handle zooming in and out
  onWheel(event: WheelEvent) {
    event.preventDefault(); // Prevent default scrolling

    const zoomFactor = 0.1; // Adjust this for sensitivity
    const oldZoomLevel = this.zoomLevel;

    // Determine zoom direction
    if (event.deltaY < 0) {
      this.zoomLevel += zoomFactor; // Zoom in
    } else {
      this.zoomLevel = Math.max(1, this.zoomLevel - zoomFactor); // Zoom out, prevent going below 1
    }

    // Calculate the offset based on mouse position
    const newTranslateX = this.translateX - (this.lastMouseX - this.translateX) * (this.zoomLevel / oldZoomLevel - 1);
    const newTranslateY = this.translateY - (this.lastMouseY - this.translateY) * (this.zoomLevel / oldZoomLevel - 1);

    this.translateX = newTranslateX;
    this.translateY = newTranslateY;
  }
  openModal(image: Image) {
    this.currentImagee = image; 
    this.zoomLevel = 1; 
    this.offsetX = 0; // Reset offsets
    this.offsetY = 0; // Reset offsets
    this.modalOpen = true; // Open modal
}
loadCsvData(): Observable<string[]> {
  return this.http.get(`${API_BASE_URL}/api/csv`, { responseType: 'text' }).pipe(
    map((data) => {
      // console.log('Raw CSV Data:', data); // Log the raw CSV data
      const lines = data.split('\n');
      const submittedEmployeeIds = lines.slice(1) // Skip the first line (header)
        .map((line) => line.split(',')[0].trim()) // Get the first column (CustId)
        .filter((id) => id); // Remove empty entries
      
      // console.log('Submitted Employee IDs:', submittedEmployeeIds); // Log the final IDs
      return submittedEmployeeIds; // Return the array of IDs
    })
  );
}
fetchSubfolders() {
  this.http.get<string[]>(`${API_BASE_URL}/api/subfolders`)
    .subscribe(
      (data) => {
        this.subfolders = data;
      },
      (error) => {
        console.error('Error fetching subfolders:', error);
      }
    );
}
onFolderSelect(event: any) {
  this.selectedFolder = event.target.value;
  const thisFolder = (event.target as HTMLSelectElement).value;
  console.log('thisfolder ', thisFolder);
  console.log('Selected folder:', this.selectedFolder);
  this.loadEmployeeIds(thisFolder);
  // You can now use this.selectedFolder in other parts of your app
}
isEmployeeSubmitted(employeeId: string): boolean {
  return this.submittedEmployeeIds.includes(employeeId);
}
closeModal() {
    this.modalOpen = false; // Close modal
    this.currentImagee = null; // Reset current image
}
  // Zoom in function
  zoomIn() {
    this.zoomLevel += 0.1; // Increment zoom level
  }

  // Zoom out function
  zoomOut() {
    this.zoomLevel = Math.max(1, this.zoomLevel - 0.1); // Prevent going below 1
  }

// Method to rotate left (counterclockwise)
rotateLeft() {
  this.rotation -= 90; // Rotate 90 degrees counterclockwise
}

// Method to rotate right (clockwise)
rotateRight() {
  this.rotation += 90; // Rotate 90 degrees clockwise
}
startDrag(event: MouseEvent) {
  this.dragging = true;
  this.startX = event.clientX - this.offsetX;
  this.startY = event.clientY - this.offsetY;
}

stopDrag() {
  this.dragging = false;
}
// Set KYC for Self group
setSelfKyc(isTrue: boolean) {
  this.selfKyc.isTrue = isTrue;
  this.selfKyc.isFalse = !isTrue;
}

// Set KYC for Spouse group
setSpouseKyc(isTrue: boolean) {
  this.spouseKyc.isTrue = isTrue;
  this.spouseKyc.isFalse = !isTrue;
}
setSelfNoHit(isTrue:boolean){
  this.selfKyc.noHit = isTrue;
  this.selfKyc.noHit = !isTrue;
}
setSpouseNoHit(isTrue:boolean){
  this.spouseKyc.noHit = isTrue;
  this.spouseKyc.noHit = !isTrue;
}
drag(event: MouseEvent) {
  if (this.dragging) {
      this.offsetX = event.clientX - this.startX;
      this.offsetY = event.clientY - this.startY;
  }
}

// Method to load employee IDs
loadEmployeeIds(folder:string) {
  // console.log(selectedFolder);
  this.http.get<string[]>(`${API_BASE_URL}/api/employee/ids?folder=${folder}`).subscribe(
    (data) => {
      this.employeeIds = data;
      console.log(this.employeeIds);
      if (this.employeeIds.length > 0) {
        this.currentEmployeeIndex = 0;
        this.employeeId = this.employeeIds[this.currentEmployeeIndex]; // Set first employee ID
        this.loadImages(folder); // Fetch images for the first employee
      }
    },
    (error) => {
      console.error('Error fetching employee IDs:', error);
      alert('Failed to load employee IDs.');
    }
  );
}


loadImages(folder:string) {
  // console.log(selectedFolder);
  if (this.employeeId) {
    this.http.get<Image[]>(`${API_BASE_URL}/api/employee/${this.employeeId}/images?folder=${folder}`).subscribe(

      (data) => {
        console.log(data);
        this.images = data;
        // Reset flags
        this.hasSelfImage = false;
        this.hasSpouseImage = false;

        // Reset KYC selections for new employee
        this.selfKyc.isTrue = false;
        this.selfKyc.isFalse = false;
        this.selfKyc.noHit = false;
        this.selfKyc.comment = '';

        this.spouseKyc.isTrue = false;
        this.spouseKyc.isFalse = false;
        this.spouseKyc.noHit = false;
        this.spouseKyc.comment = '';

        // Initialize imageSelections with image names and extract employee ID and image type
        this.imageSelections = this.images.map(image => {
          const [id, imageType, , forb] = image.name.split('_');
          // Check if imageType contains 'Self'
          if (imageType.includes('Self')) {
            this.hasSelfImage = true;
          }

          // Check if imageType contains 'Spouse'
          if (imageType.includes('Spouse')) {
            this.hasSpouseImage = true;
          }
          return {
            employeeId: id, // Store employee ID
            imageName: imageType + forb, // e.g., "Self_voter_front"
            isTrue: false,
            isFalse: false,
            comment: ''
          };
        });
        this.currentIndex = 0; // Reset the current index
        this.currentImagee = this.images.length > 0 ? this.images[this.currentIndex] : null; // Set the first image if available
      },
      (error) => {
        console.error('Error fetching images:', error);
        alert('Failed to load images. Please check the Employee ID.');
        this.images = []; // Clear images on error
        this.imageSelections = [];
        this.currentImagee = null; // Reset current image
        this.currentIndex = 0; // Reset the index
      }
    );
  } else {
    alert('Please enter a valid Employee ID.');
    this.images = []; // Clear images if no ID is entered
    this.imageSelections = [];
    this.currentImagee = null; // Reset current image
    this.currentIndex = 0; // Reset the index
    // Also reset KYC selections for invalid Employee ID
    this.selfKyc.isTrue = false;
    this.selfKyc.isFalse = false;
    this.selfKyc.comment = '';

    this.spouseKyc.isTrue = false;
    this.spouseKyc.isFalse = false;
    this.spouseKyc.comment = '';
  }
}

// Method to go to the previous employee's images
previousEmployee(folder:string) {
  if (this.currentEmployeeIndex > 0) {
    this.currentEmployeeIndex--;
    this.employeeId = this.employeeIds[this.currentEmployeeIndex];
    this.loadImages(folder); // Fetch and display images for the previous employee
  }
}

// Method to go to the next employee's images
nextEmployee(folder:string) {
  if (this.currentEmployeeIndex < this.employeeIds.length - 1) {
    this.currentEmployeeIndex++;
    this.employeeId = this.employeeIds[this.currentEmployeeIndex];
    this.loadImages(folder); // Fetch and display images for the next employee
  }
}  setTrue(selectedImage:ImageSelection) {
    selectedImage.isTrue = true;
    selectedImage.isFalse = false; // Uncheck the False checkbox
}

setFalse(selectedImage:ImageSelection) {
    selectedImage.isFalse = true;
    selectedImage.isTrue = false; // Uncheck the True checkbox
}

submitComment() {
  this.loading = true;
// Define the current date and time
const currentTimestamp = new Date().toISOString();
  // Define the payload object
  const payload = {
    employeeId: this.employeeId,
    selfKyc: {
      isTrue: this.selfKyc.isTrue,
      isFalse: this.selfKyc.isFalse,
      noHit:this.selfKyc.noHit,
      comment: this.selfKyc.comment,
    },
    spouseKyc: {
      isTrue: this.spouseKyc.isTrue,
      isFalse: this.spouseKyc.isFalse,
      noHit:this.spouseKyc.noHit,
      comment: this.spouseKyc.comment,
    },
    generalComment: this.comment,
  };

  // Format and alert the payload before sending it
  const formattedPayload = JSON.stringify(payload, null, 2); // Format the payload with indentation
  alert('Submitting the following payload:\n' + formattedPayload);

  // Make the HTTP POST request
  this.http.post(`${API_BASE_URL}/api/employee/${this.employeeId}/comment`, payload)
    .subscribe(response => {
      // Format the response
      // const formattedResponse = JSON.stringify(response, null, 2); // Format JSON with indentation

      // Alert the success message with formatted response
      // alert('Your comment has been submitted successfully! Response:\n' + formattedResponse);

      this.loading = false; 
      
      // Optionally reset form or show a success message
      // this.resetForm();
    }, error => {
      console.error('Error submitting data:', error);
      this.loading = false; 
      
      // Show error alert
      alert('Failed to submit data. Please try again.');
    });
}
 

  get currentImage() {
    return this.images[this.currentIndex];
  }

}
